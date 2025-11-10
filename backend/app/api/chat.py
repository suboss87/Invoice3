"""
Chat API routes - Q&A about invoices using RAG
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db, ChatMessage
from app.services.rag_service import RAGService
from app.models import ChatRequest, ChatResponse
import uuid
from datetime import datetime
import json

router = APIRouter()
rag_service = RAGService()

@router.post("/ask", response_model=ChatResponse)
async def ask_question(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Ask a question about an invoice using RAG
    
    Features:
    - Multi-query decomposition for complex questions
    - Semantic search over invoice data
    - Context-aware answer generation
    - Citation tracking
    """
    
    try:
        # Call RAG service
        result = await rag_service.answer_question(
            request.question,
            request.invoice_id
        )
        
        # Save to database
        message = ChatMessage(
            message_id=str(uuid.uuid4()),
            invoice_id=request.invoice_id,
            question=request.question,
            answer=result['answer'],
            sub_queries=json.dumps(result.get('sub_queries', [])),
            citations=json.dumps(result.get('citations', []))
        )
        db.add(message)
        db.commit()
        
        return ChatResponse(
            answer=result['answer'],
            sub_queries=result.get('sub_queries'),
            citations=result.get('citations'),
            confidence=result.get('confidence')
        )
    
    except Exception as e:
        print(f"❌ Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{invoice_id}/history")
async def get_chat_history(
    invoice_id: str,
    db: Session = Depends(get_db)
):
    """Get chat history for an invoice"""
    
    messages = db.query(ChatMessage)\
        .filter_by(invoice_id=invoice_id)\
        .order_by(ChatMessage.created_at.asc())\
        .all()
    
    return {
        "messages": [
            {
                "message_id": msg.message_id,
                "question": msg.question,
                "answer": msg.answer,
                "sub_queries": json.loads(msg.sub_queries) if msg.sub_queries else [],
                "citations": json.loads(msg.citations) if msg.citations else [],
                "created_at": msg.created_at.isoformat() if msg.created_at else None
            }
            for msg in messages
        ],
        "count": len(messages)
    }

