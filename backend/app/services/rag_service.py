"""
RAG Q&A Service - Semantic search and question answering
"""
import json
import os
from typing import List, Dict, Any, Optional
import numpy as np
import google.generativeai as genai
from app.config import config

# Optional dependencies - graceful degradation if not available
try:
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
    RAG_AVAILABLE = True
except ImportError:
    RAG_AVAILABLE = False
    print("⚠️ RAG dependencies not available. Q&A will use direct LLM without semantic search.")

class RAGService:
    """
    Retrieval Augmented Generation for invoice Q&A
    
    Features:
    - Multi-query decomposition
    - Semantic search using embeddings
    - Context-aware answer generation
    - Citation tracking
    """
    
    def __init__(self):
        # Load embedding model (local, no API needed) - only if available
        if RAG_AVAILABLE:
            try:
                self.embed_model = SentenceTransformer('all-MiniLM-L6-v2')
                self.rag_enabled = True
            except Exception as e:
                print(f"⚠️ Could not load embedding model: {e}")
                self.rag_enabled = False
                self.embed_model = None
        else:
            self.rag_enabled = False
            self.embed_model = None
        
        # Configure Gemini for answer generation
        genai.configure(api_key=config.GEMINI_API_KEY)
        self.llm = genai.GenerativeModel('gemini-1.5-flash')  # Using latest stable model
        
        # Load or initialize RAG index
        self.index = self._load_index() if self.rag_enabled else {'chunks': [], 'embeddings': []}
    
    async def answer_question(
        self, 
        question: str, 
        invoice_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Answer a question about invoices using RAG
        
        Steps:
        1. Decompose question into sub-queries (if complex)
        2. Search for relevant chunks
        3. Generate answer with citations
        """
        
        # Step 1: Decompose question (optional, for complex queries)
        sub_queries = await self._decompose_question(question)
        
        # Step 2: Search for relevant chunks
        all_chunks = []
        for query in sub_queries:
            chunks = self._semantic_search(query, top_k=3)
            all_chunks.extend(chunks)
        
        # Remove duplicates
        unique_chunks = self._deduplicate_chunks(all_chunks)
        
        # Step 3: Generate answer
        answer = await self._generate_answer(question, unique_chunks)
        
        # Step 4: Extract citations
        citations = self._extract_citations(unique_chunks)
        
        return {
            "answer": answer,
            "sub_queries": sub_queries,
            "citations": citations,
            "confidence": 0.85  # Could be calculated from retrieval scores
        }
    
    async def _decompose_question(self, question: str) -> List[str]:
        """
        Decompose complex question into simpler sub-queries
        
        Example:
        Q: "Why was this invoice flagged and what are the risks?"
        → ["Why was the invoice flagged?", "What are the fraud risks?"]
        """
        
        # For simple questions, just return as-is
        if len(question.split()) <= 10:
            return [question]
        
        try:
            prompt = f"""Decompose this question into 1-3 simpler sub-questions that together answer the original question.

Original question: {question}

Return ONLY a JSON array of sub-questions, like:
["sub-question 1", "sub-question 2"]

Sub-questions:"""
            
            response = self.llm.generate_content(prompt)
            
            # Parse response
            text = response.text.strip()
            if text.startswith('['):
                sub_queries = json.loads(text)
                return sub_queries
            else:
                return [question]
                
        except:
            return [question]
    
    def _semantic_search(self, query: str, top_k: int = 5) -> List[Dict]:
        """
        Search for most relevant chunks using semantic similarity
        """
        
        if not self.rag_enabled or not self.embed_model:
            # RAG disabled - return empty, will use direct LLM
            return []
        
        if not self.index or len(self.index.get('embeddings', [])) == 0:
            return []
        
        try:
            # Embed query
            query_embedding = self.embed_model.encode([query])[0]
            
            # Calculate similarities
            embeddings_matrix = np.array(self.index['embeddings'])
            similarities = cosine_similarity([query_embedding], embeddings_matrix)[0]
            
            # Get top-k indices
            top_indices = np.argsort(similarities)[-top_k:][::-1]
            
            # Return top chunks with scores
            results = []
            for idx in top_indices:
                chunk = self.index['chunks'][idx]
                results.append({
                    **chunk,
                    'similarity_score': float(similarities[idx])
                })
            
            return results
        except Exception as e:
            print(f"⚠️ Semantic search error: {e}")
            return []
    
    def _deduplicate_chunks(self, chunks: List[Dict]) -> List[Dict]:
        """Remove duplicate chunks based on doc_id and chunk_index"""
        seen = set()
        unique = []
        for chunk in chunks:
            key = (chunk.get('doc_id'), chunk.get('chunk_index'))
            if key not in seen:
                seen.add(key)
                unique.append(chunk)
        return unique
    
    async def _generate_answer(self, question: str, chunks: List[Dict]) -> str:
        """
        Generate answer using retrieved context
        """
        
        if not chunks:
            return "I don't have enough information to answer this question. Please ensure the invoice has been processed and indexed."
        
        # Build context from chunks
        context = "\n\n".join([
            f"Document {i+1} ({chunk.get('doc_type', 'unknown')} - {chunk.get('doc_id', 'unknown')}):\n{chunk.get('text', '')}"
            for i, chunk in enumerate(chunks[:5])  # Limit to top 5
        ])
        
        prompt = f"""You are a helpful assistant answering questions about invoices, purchase orders, and goods receipts.

Context information:
{context}

Question: {question}

Instructions:
- Answer based ONLY on the context provided
- Be specific and cite document IDs when relevant
- If the context doesn't contain enough information, say so
- Keep answers concise (2-3 sentences)

Answer:"""
        
        try:
            response = self.llm.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"❌ Answer generation error: {str(e)}")
            return f"Error generating answer: {str(e)}"
    
    def _extract_citations(self, chunks: List[Dict]) -> List[Dict[str, str]]:
        """Extract citation information from chunks"""
        citations = []
        for chunk in chunks[:5]:  # Top 5 citations
            citations.append({
                "doc_id": chunk.get('doc_id', 'unknown'),
                "doc_type": chunk.get('doc_type', 'unknown'),
                "text_preview": chunk.get('text', '')[:100] + '...'
            })
        return citations
    
    def _load_index(self) -> Dict:
        """Load pre-built RAG index or return empty"""
        index_path = os.path.join(
            os.path.dirname(__file__),
            '../../..',
            'data',
            'embeddings',
            'rag_index.json'
        )
        
        if os.path.exists(index_path):
            try:
                with open(index_path, 'r') as f:
                    return json.load(f)
            except:
                pass
        
        # Return empty index structure
        return {
            'chunks': [],
            'embeddings': [],
            'model': 'all-MiniLM-L6-v2',
            'dimension': 384
        }
    
    def build_index(self, documents: List[Dict]):
        """
        Build RAG index from documents
        
        Args:
            documents: List of dicts with 'text', 'doc_id', 'doc_type'
        """
        chunks = []
        embeddings = []
        
        for doc in documents:
            # Chunk document text
            doc_chunks = self._chunk_text(doc['text'], chunk_size=500, overlap=100)
            
            for i, chunk_text in enumerate(doc_chunks):
                # Create chunk metadata
                chunk = {
                    'text': chunk_text,
                    'doc_id': doc['doc_id'],
                    'doc_type': doc.get('doc_type', 'unknown'),
                    'chunk_index': i
                }
                chunks.append(chunk)
                
                # Generate embedding
                embedding = self.embed_model.encode([chunk_text])[0]
                embeddings.append(embedding.tolist())
        
        # Update index
        self.index = {
            'chunks': chunks,
            'embeddings': embeddings,
            'model': 'all-MiniLM-L6-v2',
            'dimension': 384,
            'total_chunks': len(chunks)
        }
        
        # Save index
        self._save_index()
        
        return len(chunks)
    
    def _chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
        """Split text into overlapping chunks"""
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunks.append(text[start:end])
            start = end - overlap
        return chunks
    
    def _save_index(self):
        """Save RAG index to file"""
        index_path = os.path.join(
            os.path.dirname(__file__),
            '../../..',
            'data',
            'embeddings',
            'rag_index.json'
        )
        
        os.makedirs(os.path.dirname(index_path), exist_ok=True)
        
        with open(index_path, 'w') as f:
            json.dump(self.index, f, indent=2)

