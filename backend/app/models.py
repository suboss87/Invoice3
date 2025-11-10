"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Request Models
class ChatRequest(BaseModel):
    """Request to ask a question about an invoice"""
    invoice_id: str
    question: str

class ApprovalRequest(BaseModel):
    """Request to approve/reject an invoice"""
    invoice_id: str
    action: str = Field(..., pattern="^(APPROVE|REJECT|REVIEW)$")
    notes: Optional[str] = None

# Response Models
class InvoiceField(BaseModel):
    """Single extracted field with confidence"""
    value: Any
    confidence: Optional[float] = None

class ExtractionResult(BaseModel):
    """Result of ADE extraction"""
    fields: Dict[str, Any]
    confidence_scores: Dict[str, float]
    quality_score: float
    extraction_time_seconds: float
    field_count: int

class MatchingResult(BaseModel):
    """Result of 3-way matching"""
    invoice_po_score: int
    invoice_po_status: str
    invoice_po_mismatches: List[str]
    invoice_grn_score: int
    invoice_grn_status: str
    invoice_grn_mismatches: List[str]
    overall_status: str
    overall_score: int

class FraudSignal(BaseModel):
    """Individual fraud signal"""
    type: str
    severity: str
    description: str
    risk_points: int

class FraudResult(BaseModel):
    """Result of fraud detection"""
    risk_score: int
    risk_level: str
    signals: List[FraudSignal]
    checks_performed: Dict[str, bool]

class ValidationResult(BaseModel):
    """Complete validation result"""
    matching: MatchingResult
    fraud: FraudResult
    recommendation: str
    reasoning: str
    summary: str

class InvoiceDetail(BaseModel):
    """Complete invoice details"""
    invoice_id: str
    invoice_number: Optional[str]
    vendor_id: Optional[str]
    po_number: Optional[str]
    status: str
    extracted_data: Optional[ExtractionResult]
    matching_result: Optional[MatchingResult]
    fraud_result: Optional[FraudResult]
    recommendation: Optional[str]
    uploaded_at: datetime
    processed_at: Optional[datetime]
    processing_log: Optional[List[Dict[str, Any]]]

class InvoiceListItem(BaseModel):
    """Invoice list item for dashboard"""
    invoice_id: str
    invoice_number: Optional[str]
    vendor_id: Optional[str]
    status: str
    recommendation: Optional[str]
    risk_score: Optional[int]
    uploaded_at: datetime

class UploadResponse(BaseModel):
    """Response after upload"""
    invoice_id: str
    status: str
    message: str

class ChatResponse(BaseModel):
    """Response from Q&A system"""
    answer: str
    sub_queries: Optional[List[str]]
    citations: Optional[List[Dict[str, str]]]
    confidence: Optional[float]

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    timestamp: datetime
