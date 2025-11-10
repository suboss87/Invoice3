"""
LandingAI ADE Service - Deep extraction of 45+ fields from invoices
Uses the official landingai-ade library for Agentic Document Extraction
"""
import time
import tempfile
import os
import requests
import base64
import json
import asyncio
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from app.config import config

# Import the official landingai-ade library (v0.20+)
try:
    from landingai_ade import LandingAIADE
    LANDINGAI_AVAILABLE = True
except ImportError:
    LANDINGAI_AVAILABLE = False
    print("⚠️ landingai-ade library not available")

# Define Pydantic model for 45-field extraction
class LineItem(BaseModel):
    line_number: Optional[int] = None
    description: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    line_total: Optional[float] = None
    tax_code: Optional[str] = None
    po_line_ref: Optional[str] = None

class InvoiceExtraction(BaseModel):
    # Vendor Information (10 fields)
    vendor_name: Optional[str] = Field(None, description="Company or business name of the vendor")
    vendor_address: Optional[str] = Field(None, description="Full street address of vendor")
    vendor_city: Optional[str] = None
    vendor_state: Optional[str] = None
    vendor_zip: Optional[str] = None
    vendor_tax_id: Optional[str] = Field(None, description="Tax ID, EIN, or VAT number")
    vendor_email: Optional[str] = None
    vendor_phone: Optional[str] = None
    vendor_contact: Optional[str] = Field(None, description="Contact person name")
    vendor_website: Optional[str] = None
    
    # Bank Details (5 fields)
    bank_name: Optional[str] = None
    bank_account: Optional[str] = Field(None, description="Bank account number")
    routing_number: Optional[str] = None
    swift_code: Optional[str] = None
    iban: Optional[str] = None
    
    # Invoice Header (10 fields)
    invoice_number: Optional[str] = Field(None, description="Invoice or bill number")
    invoice_date: Optional[str] = Field(None, description="Date invoice was issued")
    due_date: Optional[str] = Field(None, description="Payment due date")
    issue_date: Optional[str] = None
    po_number: Optional[str] = Field(None, description="Purchase order reference number")
    grn_number: Optional[str] = Field(None, description="Goods receipt note")
    contract_number: Optional[str] = None
    requisition_number: Optional[str] = None
    currency: Optional[str] = Field(None, description="Currency code like USD, EUR")
    exchange_rate: Optional[float] = None
    
    # Amounts (8 fields)
    subtotal: Optional[float] = Field(None, description="Subtotal before tax")
    tax: Optional[float] = Field(None, description="Tax amount")
    tax_rate: Optional[float] = Field(None, description="Tax rate percentage")
    shipping: Optional[float] = None
    handling: Optional[float] = None
    discount: Optional[float] = None
    total: Optional[float] = Field(None, description="Total invoice amount")
    amount_due: Optional[float] = Field(None, description="Amount due for payment")
    
    # Line Items
    line_items: Optional[List[LineItem]] = Field(None, description="Array of invoice line items")
    
    # Terms & Delivery (7 fields)
    payment_terms: Optional[str] = Field(None, description="Payment terms like Net 30")
    payment_method: Optional[str] = None
    delivery_date: Optional[str] = None
    delivery_address: Optional[str] = None
    billing_address: Optional[str] = None
    shipping_method: Optional[str] = None
    tracking_number: Optional[str] = None
    
    # Additional (5 fields)
    notes: Optional[str] = None
    terms_conditions: Optional[str] = None
    approved_by: Optional[str] = None
    prepared_by: Optional[str] = None
    invoice_type: Optional[str] = None

class ADEService:
    """
    Deep LandingAI ADE Integration - 45+ Fields Extraction
    
    Capabilities:
    - Parse PDF to layout-aware markdown
    - Extract 45 structured fields using JSON schema
    - Table extraction for line items
    - Field-level confidence scores
    """
    
    def __init__(self):
        self.api_key = config.LANDING_AI_API_KEY
        self.base_url = config.LANDING_AI_BASE_URL
        
    async def extract_invoice(self, pdf_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Complete extraction pipeline using official LandingAI library
        
        Returns:
            Dictionary with:
            - fields: 45 extracted fields
            - confidence_scores: per-field confidence
            - quality_score: overall extraction quality (0-100)
            - extraction_time_seconds: processing time
            - field_count: number of fields extracted
        """
        start_time = time.time()
        
        try:
            if not LANDINGAI_AVAILABLE or not self.api_key:
                print("⚠️ LandingAI not available or API key missing, using fallback")
                return await self._fallback_full_extraction(pdf_bytes, filename)
            
            # Save PDF bytes to temporary file with proper extension
            # Use the original filename to preserve the extension
            file_extension = '.pdf'
            if filename:
                ext = os.path.splitext(filename)[1].lower()
                if ext in ['.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.tif']:
                    file_extension = ext
            
            with tempfile.NamedTemporaryFile(suffix=file_extension, delete=False, mode='wb') as tmp_file:
                tmp_file.write(pdf_bytes)
                tmp_file.flush()  # Ensure all data is written
                tmp_path = tmp_file.name
            
            try:
                print(f"🔄 Using LandingAI ADE v0.20+ for Parse + Extract")
                print(f"  File: {filename} → {tmp_path}")
                
                # Initialize client - Set the correct environment variable
                # The library expects VISION_AGENT_API_KEY (per official docs)
                os.environ['VISION_AGENT_API_KEY'] = self.api_key
                os.environ['LANDINGAI_ADE_API_KEY'] = self.api_key  # Also set this for compatibility
                client = LandingAIADE()
                
                # STEP 1: PARSE - PDF → Markdown + Chunks
                print(f"  Step 1: Parsing document with LandingAI...")
                # Pass the file path directly - library handles file reading
                from pathlib import Path
                parse_result = client.parse(document=Path(tmp_path))
                
                # Extract markdown from result
                markdown = parse_result.markdown if hasattr(parse_result, 'markdown') else str(parse_result)
                print(f"  ✅ Parsed {len(markdown)} chars of markdown")
                
                # STEP 2: EXTRACT - Use LandingAI Extract API with 45-field schema (retry 3x before fallback)
                print(f"  Step 2: Extracting 45 fields with LandingAI Extract API...")
                
                # Retry LandingAI Extract API up to 3 times before Gemini fallback
                extracted = None
                max_retries = 3
                for attempt in range(1, max_retries + 1):
                    try:
                        print(f"    Attempt {attempt}/{max_retries}...")
                        extracted = await self._extract_with_landingai_client(client, markdown, parse_result)
                        field_count = len(extracted.get('data', {}))
                        print(f"  ✅ Extracted {field_count} fields with LandingAI on attempt {attempt}")
                        break  # Success - exit retry loop
                    except Exception as extract_error:
                        print(f"    ❌ Attempt {attempt} failed: {str(extract_error)}")
                        if attempt == max_retries:
                            # All retries exhausted - fall back to Gemini
                            print(f"  ⚠️ LandingAI Extract failed after {max_retries} attempts, falling back to Gemini...")
                            extracted = await self._extract_with_llm(markdown)
                            field_count = len(extracted.get('data', {}))
                            print(f"  ✅ Extracted {field_count} fields with Gemini fallback")
                        else:
                            # Wait 2 seconds before retry
                            await asyncio.sleep(2)
                
                # Step 3: Validate and normalize
                validated = self._validate_extraction(extracted)
                
                # Step 4: Calculate quality score
                quality_score = self._calculate_quality(validated)
                
                extraction_time = time.time() - start_time
                
                return {
                    "fields": validated,
                    "confidence_scores": extracted.get('confidence', {}),
                    "quality_score": quality_score,
                    "extraction_time_seconds": round(extraction_time, 2),
                    "field_count": len(validated),
                    "raw_markdown": markdown,  # Store for audit compliance
                    "markdown": markdown[:1000]  # Truncated for API response
                }
            
            finally:
                # Clean up temporary file
                try:
                    os.unlink(tmp_path)
                except:
                    pass
            
        except Exception as e:
            print(f"❌ ADE extraction error: {str(e)}")
            print(f"   Falling back to manual extraction")
            return await self._fallback_full_extraction(pdf_bytes, filename)
    
    async def _parse_document(self, pdf_bytes: bytes, filename: str) -> str:
        """
        Step 1: Parse PDF to layout-aware markdown using LandingAI
        
        This preserves document structure, tables, and formatting
        """
        try:
            # Encode PDF as base64 for API
            pdf_b64 = base64.b64encode(pdf_bytes).decode('utf-8')
            
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                "document": pdf_b64,
                "filename": filename
            }
            
            response = requests.post(
                f"{self.base_url}/parse",
                json=payload,
                headers=headers,
                timeout=120
            )
            
            if response.status_code != 200:
                raise Exception(f"Parse API failed: {response.status_code} - {response.text}")
            
            result = response.json()
            return result.get('markdown', result.get('text', ''))
            
        except Exception as e:
            print(f"❌ Parse error: {str(e)}")
            # Fallback: try to extract text manually
            return self._fallback_text_extraction(pdf_bytes)
    
    async def _extract_structured(self, markdown: str) -> Dict:
        """
        Step 2: Extract 45 structured fields using JSON schema
        
        Uses LandingAI extract API if available, otherwise falls back to LLM
        
        Fields extracted:
        - Vendor info (10 fields)
        - Bank details (5 fields)
        - Invoice header (10 fields)
        - Amounts (8 fields)
        - Line items (table)
        - Terms & delivery (7 fields)
        - Additional (5 fields)
        """
        
        # Try LandingAI extract API first
        if self.api_key and self.base_url:
            try:
                return await self._extract_with_landingai_api(markdown)
            except Exception as e:
                print(f"⚠️ LandingAI extract API failed: {str(e)}, falling back to LLM")
        
        # Fallback to LLM extraction
        return await self._extract_with_llm(markdown)
    
    async def _extract_with_landingai_client(self, client: Any, markdown: str, parse_result: Any) -> Dict:
        """
        STEP 2: Extract using LandingAI official client library (CORRECT METHOD)

        Based on official LandingAI example:
        https://github.com/landing-ai/ade-helper-scripts/

        The extract() method expects:
        - schema: JSON schema from Pydantic model
        - markdown: BytesIO object (NOT string!)
        """
        import io

        # 45-FIELD INVOICE SCHEMA (same as before, but will be used correctly)
        schema = {
            "type": "object",
            "properties": {
                # Vendor Information (10 fields)
                "vendor_name": {"type": "string", "description": "Company or business name"},
                "vendor_address": {"type": "string"},
                "vendor_city": {"type": "string"},
                "vendor_state": {"type": "string"},
                "vendor_zip": {"type": "string"},
                "vendor_tax_id": {"type": "string"},
                "vendor_email": {"type": "string"},
                "vendor_phone": {"type": "string"},
                "vendor_contact": {"type": "string"},
                "vendor_website": {"type": "string"},

                # Bank Details (5 fields)
                "bank_name": {"type": "string"},
                "bank_account": {"type": "string"},
                "routing_number": {"type": "string"},
                "swift_code": {"type": "string"},
                "iban": {"type": "string"},

                # Invoice Header (10 fields)
                "invoice_number": {"type": "string"},
                "invoice_date": {"type": "string"},
                "due_date": {"type": "string"},
                "issue_date": {"type": "string"},
                "po_number": {"type": "string", "description": "Purchase order number - CRITICAL"},
                "grn_number": {"type": "string"},
                "contract_number": {"type": "string"},
                "requisition_number": {"type": "string"},
                "currency": {"type": "string"},
                "exchange_rate": {"type": "number"},

                # Amounts (8 fields)
                "subtotal": {"type": "number"},
                "tax": {"type": "number"},
                "tax_rate": {"type": "number"},
                "shipping": {"type": "number"},
                "handling": {"type": "number"},
                "discount": {"type": "number"},
                "total": {"type": "number", "description": "Total invoice amount - CRITICAL"},
                "amount_due": {"type": "number"},

                # Line Items
                "line_items": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "line_number": {"type": "integer"},
                            "description": {"type": "string"},
                            "quantity": {"type": "number"},
                            "unit_price": {"type": "number"},
                            "line_total": {"type": "number"},
                            "tax_code": {"type": "string"},
                            "po_line_ref": {"type": "string"}
                        }
                    }
                },

                # Terms & Delivery (7 fields)
                "payment_terms": {"type": "string"},
                "payment_method": {"type": "string"},
                "delivery_date": {"type": "string"},
                "delivery_address": {"type": "string"},
                "billing_address": {"type": "string"},
                "shipping_method": {"type": "string"},
                "tracking_number": {"type": "string"},

                # Additional (5 fields)
                "notes": {"type": "string"},
                "terms_conditions": {"type": "string"},
                "approved_by": {"type": "string"},
                "prepared_by": {"type": "string"},
                "invoice_type": {"type": "string"}
            },
            "required": ["vendor_name", "invoice_number", "total"]
        }

        try:
            print(f"    Using official LandingAI client.extract() method...")

            # KEY FIX: Convert schema dict to JSON string (required by API)
            schema_json = json.dumps(schema)

            # Call extract() with the official method signature
            extract_result = client.extract(
                schema=schema_json,  # JSON string, not dict
                markdown=markdown     # String is acceptable (no need for BytesIO)
            )

            print(f"    ✅ Extract successful!")

            # Parse result - LandingAI ExtractResponse has 'extraction' attribute
            data = {}
            if hasattr(extract_result, 'extraction'):
                data = extract_result.extraction
                print(f"    🔍 Found extraction attribute with {len(data)} fields")
            elif hasattr(extract_result, 'data'):
                data = extract_result.data
                print(f"    🔍 Found data attribute: {data}")
            elif hasattr(extract_result, 'fields'):
                data = extract_result.fields
                print(f"    🔍 Found fields attribute: {data}")
            elif isinstance(extract_result, dict):
                data = extract_result
                print(f"    🔍 Extract_result is dict: {data}")
            else:
                # Try to convert to dict via __dict__ or model_dump
                if hasattr(extract_result, 'model_dump'):
                    data = extract_result.model_dump()
                    print(f"    🔍 Using model_dump(): {data}")
                elif hasattr(extract_result, 'dict'):
                    data = extract_result.dict()
                    print(f"    🔍 Using dict(): {data}")
                elif hasattr(extract_result, '__dict__'):
                    data = extract_result.__dict__
                    print(f"    🔍 Using __dict__: {data}")
                else:
                    print(f"    ❌ Could not extract data from result")
                    data = {}

            return {
                'data': data,
                'confidence': getattr(extract_result, 'confidence', {})
            }

        except Exception as e:
            print(f"    ❌ LandingAI client.extract() error: {str(e)}")
            raise

    async def _extract_with_landingai_extract(self, markdown: str, parse_result: Any) -> Dict:
        """
        STEP 2: Extract using LandingAI Extract API with 45-field schema
        
        This is the proper two-step ADE workflow:
        1. Parse (already done) → markdown
        2. Extract (this method) → structured 45 fields
        """
        
        # 45-FIELD INVOICE SCHEMA (Enterprise-grade extraction)
        schema = {
            "type": "object",
            "properties": {
                # Vendor Information (10 fields) - Critical for validation
                "vendor_name": {"type": "string", "description": "Company or business name"},
                "vendor_address": {"type": "string", "description": "Street address"},
                "vendor_city": {"type": "string"},
                "vendor_state": {"type": "string"},
                "vendor_zip": {"type": "string"},
                "vendor_tax_id": {"type": "string", "description": "Tax ID, EIN, or VAT number"},
                "vendor_email": {"type": "string"},
                "vendor_phone": {"type": "string"},
                "vendor_contact": {"type": "string"},
                "vendor_website": {"type": "string"},
                
                # Bank Details (5 fields) - Critical for fraud detection
                "bank_name": {"type": "string"},
                "bank_account": {"type": "string", "description": "Bank account number"},
                "routing_number": {"type": "string", "description": "Routing or sort code"},
                "swift_code": {"type": "string"},
                "iban": {"type": "string"},
                
                # Invoice Header (10 fields) - Critical for 3-way matching
                "invoice_number": {"type": "string", "description": "Invoice or bill number"},
                "invoice_date": {"type": "string"},
                "due_date": {"type": "string"},
                "issue_date": {"type": "string"},
                "po_number": {"type": "string", "description": "Purchase order number - CRITICAL"},
                "grn_number": {"type": "string", "description": "Goods receipt note - CRITICAL"},
                "contract_number": {"type": "string"},
                "requisition_number": {"type": "string"},
                "currency": {"type": "string", "description": "Currency code (USD, EUR, etc.)"},
                "exchange_rate": {"type": "number"},
                
                # Amounts (8 fields) - Critical for validation
                "subtotal": {"type": "number", "description": "Amount before tax"},
                "tax": {"type": "number", "description": "Tax amount"},
                "tax_rate": {"type": "number", "description": "Tax percentage"},
                "shipping": {"type": "number"},
                "handling": {"type": "number"},
                "discount": {"type": "number"},
                "total": {"type": "number", "description": "Total invoice amount - CRITICAL"},
                "amount_due": {"type": "number"},
                
                # Line Items - Critical for quantity matching
                "line_items": {
                    "type": "array",
                    "description": "Invoice line items with quantities",
                    "items": {
                        "type": "object",
                        "properties": {
                            "line_number": {"type": "integer"},
                            "description": {"type": "string"},
                            "quantity": {"type": "number", "description": "CRITICAL for GRN matching"},
                            "unit_price": {"type": "number"},
                            "line_total": {"type": "number"},
                            "tax_code": {"type": "string"},
                            "po_line_ref": {"type": "string"}
                        }
                    }
                },
                
                # Terms & Delivery (7 fields)
                "payment_terms": {"type": "string", "description": "e.g., Net 30"},
                "payment_method": {"type": "string"},
                "delivery_date": {"type": "string", "description": "Date goods delivered"},
                "delivery_address": {"type": "string"},
                "billing_address": {"type": "string"},
                "shipping_method": {"type": "string"},
                "tracking_number": {"type": "string"},
                
                # Additional (5 fields)
                "notes": {"type": "string"},
                "terms_conditions": {"type": "string"},
                "approved_by": {"type": "string"},
                "prepared_by": {"type": "string"},
                "invoice_type": {"type": "string"}
            },
            "required": ["vendor_name", "invoice_number", "total", "po_number"]
        }
        
        try:
            # Try using the client's extract method if available
            if hasattr(parse_result, 'id') or hasattr(parse_result, 'document_id'):
                # Some versions support direct extraction from parse result
                doc_id = getattr(parse_result, 'id', getattr(parse_result, 'document_id', None))
                if doc_id:
                    print(f"    Using parsed document ID for extraction...")
            
            # Call LandingAI Extract API
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            # Prepare payload for Extract API
            # The API requires either 'markdown' or 'markdown_url' in the request body
            payload = {
                "markdown": markdown[:50000],  # Limit markdown size if needed
                "schema": schema  # LandingAI uses 'schema' parameter
            }
            
            print(f"    Calling Extract API with {len(markdown)} chars of markdown...")
            
            # Call Extract endpoint
            response = requests.post(
                f"{self.base_url}/extract",
                json=payload,
                headers=headers,
                timeout=90
            )
            
            print(f"    Extract API response: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'data': result.get('data', result.get('fields', {})),
                    'confidence': result.get('confidence', result.get('confidence_scores', {}))
                }
            else:
                error_detail = response.text
                print(f"    Extract API returned {response.status_code}: {error_detail[:200]}")
                raise Exception(f"Extract API failed: {response.status_code}")
            
        except Exception as e:
            print(f"    ❌ LandingAI Extract error: {str(e)}")
            # Re-raise to trigger Gemini fallback in main flow
            raise
    
    async def _extract_with_llm(self, markdown: str) -> Dict:
        """Fallback: Extract using Gemini LLM with full 45-field schema"""
        import google.generativeai as genai
        
        try:
            genai.configure(api_key=config.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            prompt = f"""Extract ALL invoice data from this document and return a FLAT JSON object with these fields (no nested categories):

{{
  "vendor_name": "company name",
  "vendor_address": "street address",
  "vendor_city": "city",
  "vendor_state": "state",
  "vendor_zip": "zip code",
  "vendor_tax_id": "tax ID",
  "vendor_email": "email",
  "vendor_phone": "phone",
  "vendor_contact": "contact person",
  "vendor_website": "website",
  "bank_name": "bank name",
  "bank_account": "account number",
  "routing_number": "routing",
  "swift_code": "swift",
  "iban": "iban",
  "invoice_number": "invoice number",
  "invoice_date": "invoice date",
  "due_date": "due date",
  "issue_date": "issue date",
  "po_number": "PO number",
  "grn_number": "GRN number",
  "contract_number": "contract",
  "requisition_number": "requisition",
  "currency": "currency",
  "exchange_rate": number,
  "subtotal": number,
  "tax": number,
  "tax_rate": number,
  "shipping": number,
  "handling": number,
  "discount": number,
  "total": number,
  "amount_due": number,
  "line_items": [
    {{"description": "item", "quantity": number, "unit_price": number, "line_total": number}}
  ],
  "payment_terms": "terms",
  "payment_method": "method",
  "delivery_date": "date",
  "delivery_address": "address",
  "billing_address": "address",
  "shipping_method": "method",
  "tracking_number": "number",
  "notes": "notes",
  "terms_conditions": "terms",
  "approved_by": "approver",
  "prepared_by": "preparer",
  "invoice_type": "type"
}}

Document text:
{markdown[:5000]}

Return ONLY valid JSON with FLAT structure (no nested objects except line_items array). Use null for missing fields."""
            
            response = model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Clean up response
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.startswith('```'):
                result_text = result_text[3:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            
            extracted_fields = json.loads(result_text)
            
            # Flatten nested structure if LLM returned categories
            flattened = {}
            for key, value in extracted_fields.items():
                if isinstance(value, dict) and key.isupper():
                    # This is a category (e.g., "VENDOR INFORMATION"), flatten it
                    flattened.update(value)
                else:
                    # This is a regular field
                    flattened[key] = value
            
            return {'data': flattened, 'confidence': {}}
        
        except Exception as e:
            print(f"⚠️ LLM extraction failed: {str(e)}, using regex fallback")
            return self._fallback_extraction(markdown)
    
    def _validate_extraction(self, extracted: Dict) -> Dict:
        """
        Step 3: Validate and normalize extracted fields
        """
        fields = extracted.get('data', extracted.get('fields', extracted))
        
        # Flatten nested structure if present (double-check)
        flattened = {}
        for key, value in fields.items():
            if isinstance(value, dict) and key.isupper():
                # This is a category, flatten it
                flattened.update(value)
            else:
                flattened[key] = value
        
        # Ensure all expected fields exist (with None if missing)
        validated = {}
        
        # Normalize field names and values
        for key, value in flattened.items():
            if value is not None:
                # Normalize vendor names (capitalize properly)
                if key == 'vendor_name' and isinstance(value, str):
                    value = value.strip().title()
                
                # Normalize numbers
                if key in ['subtotal', 'tax', 'total', 'amount_due', 'shipping', 'handling', 'discount']:
                    try:
                        value = float(value) if value else 0.0
                    except:
                        value = 0.0
                
                validated[key] = value
        
        return validated
    
    def _calculate_quality(self, validated: Dict) -> float:
        """
        Step 4: Calculate overall extraction quality score (0-100)
        
        Based on realistic field expectations for production invoices:
        - Core fields (25 fields): commonly present in most invoices
        - Critical fields: must be present for processing
        - Optional fields: nice to have but not required
        """
        # Core fields expected in most production invoices (25 fields)
        core_fields = [
            # Vendor (6 core fields)
            'vendor_name', 'vendor_address', 'vendor_city', 'vendor_state', 'vendor_zip', 'vendor_tax_id',
            # Bank (2 core fields)
            'bank_name', 'bank_account',
            # Invoice header (6 core fields)
            'invoice_number', 'invoice_date', 'due_date', 'po_number', 'currency', 'issue_date',
            # Amounts (6 core fields)
            'subtotal', 'tax', 'total', 'amount_due', 'tax_rate', 'discount',
            # Terms & delivery (3 core fields)
            'payment_terms', 'delivery_address', 'billing_address',
            # Line items (always expected)
            'line_items',
            # Additional (1 core field)
            'notes'
        ]
        
        # Critical fields (must have for basic processing)
        critical_fields = ['vendor_name', 'invoice_number', 'total', 'invoice_date', 'po_number']
        
        # Count populated core fields
        core_populated = sum(1 for f in core_fields if validated.get(f) not in [None, '', 0, []])
        critical_populated = sum(1 for f in critical_fields if validated.get(f))
        
        # Calculate score with realistic expectations
        # - 50 points for core field coverage (25 fields)
        # - 40 points for critical fields (5 fields)
        # - 10 points bonus for extracting line items with multiple entries
        core_score = (core_populated / len(core_fields)) * 50
        critical_score = (critical_populated / len(critical_fields)) * 40
        
        # Bonus for line items extraction
        line_items = validated.get('line_items', [])
        if isinstance(line_items, list) and len(line_items) > 0:
            line_items_bonus = min(10, len(line_items) * 2)  # Up to 10 points
        else:
            line_items_bonus = 0
        
        total_score = core_score + critical_score + line_items_bonus
        return round(min(100, total_score), 1)
    
    def _extract_text_from_chunks(self, parsed_doc) -> str:
        """Extract text from parsed document chunks"""
        try:
            chunks = getattr(parsed_doc, 'chunks', [])
            text_parts = []
            for chunk in chunks:
                chunk_text = getattr(chunk, 'text', '') or getattr(chunk, 'content', '')
                if chunk_text:
                    text_parts.append(chunk_text)
            return '\n\n'.join(text_parts)
        except:
            return ""
    
    async def _extract_from_parsed_doc(self, parsed_doc, markdown: str) -> Dict:
        """Extract structured fields from parsed document using LLM"""
        import google.generativeai as genai
        import json
        
        try:
            # Use Gemini to extract structured fields from the markdown
            genai.configure(api_key=config.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            prompt = f"""Extract ALL invoice data as a flat JSON object with these fields:

vendor_name, vendor_address, vendor_city, vendor_state, vendor_zip, vendor_tax_id,
bank_name, bank_account, routing_number, swift_code, iban,
invoice_number, invoice_date, due_date, po_number, grn_number, currency,
subtotal, tax, tax_rate, shipping, discount, total, amount_due,
line_items (array), payment_terms, delivery_date, notes

Document text:
{markdown[:5000]}  

Return ONLY valid JSON. Use null for missing fields."""
            
            response = model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Clean up response
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.startswith('```'):
                result_text = result_text[3:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
            result_text = result_text.strip()
            
            extracted_fields = json.loads(result_text)
            
            return {'data': extracted_fields, 'confidence': {}}
        
        except Exception as e:
            print(f"⚠️ LLM extraction failed: {str(e)}, using regex fallback")
            return self._fallback_extraction(markdown)
    
    def _get_full_extraction_schema(self) -> Dict:
        """Get the complete 45-field JSON schema for LandingAI ADE extraction"""
        # Simplified schema - LandingAI prefers plain field names without complex nesting
        return {
            # Vendor Information (10 fields)
            "vendor_name": {"type": "string", "description": "Company or business name of the vendor"},
            "vendor_address": {"type": "string", "description": "Full street address of vendor"},
            "vendor_city": {"type": "string"},
            "vendor_state": {"type": "string"},
            "vendor_zip": {"type": "string"},
            "vendor_tax_id": {"type": "string", "description": "Tax ID, EIN, or VAT number"},
            "vendor_email": {"type": "string"},
            "vendor_phone": {"type": "string"},
            "vendor_contact": {"type": "string", "description": "Contact person name"},
            "vendor_website": {"type": "string"},
            
            # Bank Details (5 fields)
            "bank_name": {"type": "string"},
            "bank_account": {"type": "string", "description": "Bank account number"},
            "routing_number": {"type": "string"},
            "swift_code": {"type": "string"},
            "iban": {"type": "string"},
            
            # Invoice Header (10 fields)
            "invoice_number": {"type": "string", "description": "Invoice or bill number"},
            "invoice_date": {"type": "string", "description": "Date invoice was issued"},
            "due_date": {"type": "string", "description": "Payment due date"},
            "issue_date": {"type": "string"},
            "po_number": {"type": "string", "description": "Purchase order reference number"},
            "grn_number": {"type": "string", "description": "Goods receipt note"},
            "contract_number": {"type": "string"},
            "requisition_number": {"type": "string"},
            "currency": {"type": "string", "description": "Currency code like USD, EUR"},
            "exchange_rate": {"type": "number"},
            
            # Amounts (8 fields)
            "subtotal": {"type": "number", "description": "Subtotal before tax"},
            "tax": {"type": "number", "description": "Tax amount"},
            "tax_rate": {"type": "number", "description": "Tax rate percentage"},
            "shipping": {"type": "number"},
            "handling": {"type": "number"},
            "discount": {"type": "number"},
            "total": {"type": "number", "description": "Total invoice amount"},
            "amount_due": {"type": "number", "description": "Amount due for payment"},
            
            # Line Items (as flat array - simplified)
            "line_items": {"type": "string", "description": "Line items as JSON array string"},
            
            # Terms & Delivery (7 fields)
            "payment_terms": {"type": "string", "description": "Payment terms like Net 30"},
            "payment_method": {"type": "string"},
            "delivery_date": {"type": "string"},
            "delivery_address": {"type": "string"},
            "billing_address": {"type": "string"},
            "shipping_method": {"type": "string"},
            "tracking_number": {"type": "string"},
            
            # Additional (5 fields)
            "notes": {"type": "string"},
            "terms_conditions": {"type": "string"},
            "approved_by": {"type": "string"},
            "prepared_by": {"type": "string"},
            "invoice_type": {"type": "string"}
        }
    
    async def _fallback_full_extraction(self, pdf_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Complete fallback extraction using PyPDF2 + regex"""
        start_time = time.time()
        
        try:
            # Extract text using PyPDF2
            markdown = self._fallback_text_extraction(pdf_bytes)
            
            # Try LLM extraction first
            extracted = await self._extract_from_parsed_doc(None, markdown)
            
            # Validate
            validated = self._validate_extraction(extracted)
            quality_score = self._calculate_quality(validated)
            
            extraction_time = time.time() - start_time
            
            return {
                "fields": validated,
                "confidence_scores": {},
                "quality_score": quality_score,
                "extraction_time_seconds": round(extraction_time, 2),
                "field_count": len(validated),
                "markdown": markdown
            }
        except Exception as e:
            print(f"❌ Fallback extraction error: {str(e)}")
            return {
                "fields": {},
                "confidence_scores": {},
                "quality_score": 0,
                "extraction_time_seconds": time.time() - start_time,
                "field_count": 0,
                "markdown": ""
            }
    
    def _fallback_text_extraction(self, pdf_bytes: bytes) -> str:
        """Fallback: Extract text using PyPDF2"""
        try:
            import PyPDF2
            import io
            
            pdf_file = io.BytesIO(pdf_bytes)
            reader = PyPDF2.PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                text += page.extract_text()
            return text
        except:
            return ""
    
    def _fallback_extraction(self, markdown: str) -> Dict:
        """Fallback: Basic regex extraction if LLM fails"""
        import re
        
        fields = {}
        
        # Try to extract basic fields using regex
        patterns = {
            'invoice_number': r'Invoice\s*#?\s*:?\s*([A-Z0-9-]+)',
            'po_number': r'PO\s*#?\s*:?\s*([A-Z0-9-]+)',
            'total': r'Total\s*:?\s*\$?\s*([\d,]+\.?\d*)',
            'vendor_name': r'^([A-Z][a-zA-Z\s&]+)',
        }
        
        for field, pattern in patterns.items():
            match = re.search(pattern, markdown, re.MULTILINE | re.IGNORECASE)
            if match:
                value = match.group(1).strip()
                if field == 'total':
                    try:
                        value = float(value.replace(',', ''))
                    except:
                        value = 0.0
                fields[field] = value
        
        return {'data': fields, 'confidence': {}}

