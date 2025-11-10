"""
Invoice API routes - Upload, retrieve, process
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from app.db_interface import Invoice, PurchaseOrder, GoodsReceipt, Vendor, get_stats
from app.services.ade_service import ADEService
from app.services.agentic_validation_service import AgenticValidationService
from app.models import UploadResponse
import uuid
import json
from datetime import datetime
from typing import List, Any, Dict

router = APIRouter()

# Initialize services
ade_service = ADEService()
validation_service = AgenticValidationService()
print("🟢 Using LangGraph agentic validation service")

async def process_invoice_background(
    invoice_id: str,
    pdf_bytes: bytes,
    filename: str
):
    """
    Background task to process invoice
    
    Steps:
    1. Extract with ADE (45 fields)
    2. Find matching PO/GRN
    3. Validate with LLM
    4. Update database
    """
    processing_events: List[Dict[str, Any]] = []
    try:
        print(f"\n{'='*60}")
        print(f"🔄 Processing invoice: {invoice_id}")
        print(f"{'='*60}")
        
        # Step 1: Extract with ADE
        print("  ⏳ Step 1: ADE extraction...")
        invoice_record = Invoice.get(invoice_id)
        if not invoice_record:
            print(f"  ❌ Invoice {invoice_id} not found")
            return
        
        if getattr(invoice_record, "processing_log", None):
            try:
                processing_events = json.loads(
                    invoice_record.processing_log
                    if not isinstance(invoice_record, dict)
                    else invoice_record.get("processing_log", "[]")
                )
            except json.JSONDecodeError:
                processing_events = []

        def log_event(stage: str, message: str, payload: Dict[str, Any] | None = None):
            event = {
                "stage": stage,
                "message": message,
                "timestamp": datetime.utcnow().isoformat()
            }
            if payload:
                event["payload"] = payload
            processing_events.append(event)
            Invoice.update(invoice_id, processing_log=json.dumps(processing_events))
            print(f"    [{stage}] {message}")
        
        log_event("PIPELINE", "Invoice received. Preparing extraction.")
        
        # Update status to extracting
        Invoice.update(invoice_id, status="EXTRACTING")
        
        extraction_result = await ade_service.extract_invoice(pdf_bytes, filename)
        print(f"  ✅ Extracted {extraction_result['field_count']} fields in {extraction_result['extraction_time_seconds']}s")
        log_event(
            "ADE_EXTRACTION",
            f"Extracted {extraction_result['field_count']} fields in {extraction_result['extraction_time_seconds']}s",
            {
                "quality_score": extraction_result.get("quality_score"),
                "field_count": extraction_result.get("field_count")
            }
        )
        
        # Save extraction result
        Invoice.update(invoice_id, extracted_data=json.dumps(extraction_result))
        
        # Helper function to access nested fields
        def get_field(fields, field_name):
            """Extract field from nested structure"""
            # First try direct access (flat structure)
            if field_name in fields:
                return fields[field_name]
            
            # Then try nested categories (hierarchical structure from LLM)
            for category_name, category_data in fields.items():
                if isinstance(category_data, dict) and field_name in category_data:
                    return category_data[field_name]
            
            return None
        
        fields = extraction_result['fields']
        invoice_number = get_field(fields, 'invoice_number')
        Invoice.update(invoice_id, invoice_number=invoice_number)
        
        # Step 2: Find matching PO/GRN
        po_number = get_field(fields, 'po_number')
        grn_number = get_field(fields, 'grn_number')
        
        if not po_number:
            print("  ⚠️ No PO number found in invoice")
            log_event("MATCHING", "Failed: No PO number found in extraction.")
            Invoice.update(invoice_id, status="NO_PO_NUMBER", recommendation="REVIEW")
            return
        
        # Update status to matching
        Invoice.update(invoice_id, status="MATCHING")
        
        print(f"  🔍 Step 2: Finding PO {po_number}...")
        po = PurchaseOrder.get(po_number)
        
        if not po:
            print(f"  ⚠️ PO {po_number} not found in database")
            log_event("MATCHING", f"PO {po_number} not found in database.")
            Invoice.update(invoice_id, status="NO_PO_FOUND", recommendation="REVIEW")
            return
        
        grn = None

        if grn_number:
            grn = GoodsReceipt.get(grn_number)

        if not grn:
            grn = GoodsReceipt.get_by_po_number(po_number)
        vendor = Vendor.get(po.get('vendor_id') if isinstance(po, dict) else po.vendor_id)
        
        if not grn:
            print(f"  ⚠️ GRN not found for PO {po_number}")
            log_event("MATCHING", f"GRN not found for PO {po_number}.")
            Invoice.update(invoice_id, status="NO_GRN_FOUND", recommendation="REVIEW")
            return
        
        vendor_id = po.get('vendor_id') if isinstance(po, dict) else po.vendor_id
        if not vendor:
            print(f"  ⚠️ Vendor {vendor_id} not found")
            log_event("MATCHING", f"Vendor {vendor_id} not found.")
            Invoice.update(invoice_id, status="NO_VENDOR_FOUND", recommendation="REVIEW")
            return
        
        print(f"  ✅ Found PO, GRN, and Vendor")
        log_event("MATCHING", f"Found PO {po_number}, GRN, and vendor {vendor_id}. Beginning agentic validation.")
        
        # Update status to fraud check
        Invoice.update(invoice_id, status="FRAUD_CHECK")
        
        # Step 3: Validate with LLM
        print("  ⏳ Step 3: LLM validation (3-way matching + fraud detection)...")
        
        # Parse PO data (handle both dict and object)
        po_data = {
            'po_number': po.get('po_number') if isinstance(po, dict) else po.po_number,
            'vendor_id': po.get('vendor_id') if isinstance(po, dict) else po.vendor_id,
            'vendor_name': po.get('vendor_name') if isinstance(po, dict) else po.vendor_name,
            'total': po.get('total') if isinstance(po, dict) else po.total,
            'line_items': json.loads(po.get('line_items', '[]') if isinstance(po, dict) else (po.line_items or '[]')),
            'payment_terms': po.get('payment_terms') if isinstance(po, dict) else po.payment_terms
        }
        
        # Parse GRN data
        grn_data = {
            'grn_number': grn.get('grn_number') if isinstance(grn, dict) else grn.grn_number,
            'po_number': grn.get('po_number') if isinstance(grn, dict) else grn.po_number,
            'delivery_date': grn.get('delivery_date') if isinstance(grn, dict) else grn.delivery_date,
            'received_items': json.loads(grn.get('received_items', '[]') if isinstance(grn, dict) else (grn.received_items or '[]'))
        }
        
        # Parse vendor history
        vendor_data = {
            'vendor_id': vendor.get('vendor_id') if isinstance(vendor, dict) else vendor.vendor_id,
            'vendor_name': vendor.get('vendor_name') if isinstance(vendor, dict) else vendor.vendor_name,
            'bank_account': vendor.get('bank_account') if isinstance(vendor, dict) else vendor.bank_account,
            'routing_number': vendor.get('routing_number') if isinstance(vendor, dict) else vendor.routing_number,
            'bank_name': vendor.get('bank_name') if isinstance(vendor, dict) else vendor.bank_name,
            'invoice_history': json.loads(vendor.get('invoice_history', '{}') if isinstance(vendor, dict) else (vendor.invoice_history or '{}'))
        }
        
        # Pass extraction quality score to validation (enterprise requirement)
        extraction_quality = extraction_result.get('quality_score', 100.0)
        
        log_event("MATCH_AGENT", "Starting LangGraph validation agents.")
        validation_result = await validation_service.validate_invoice(
            extraction_result['fields'],
            po_data,
            grn_data,
            vendor_data,
            extraction_quality=extraction_quality
        )
        for insight in validation_result.get("insights", []):
            processing_events.append(insight)
        Invoice.update(
            invoice_id,
            processing_log=json.dumps(processing_events)
        )
        
        print(f"  ✅ Validation complete")
        print(f"     - Match score: {validation_result['matching']['overall_score']}/100")
        print(f"     - Risk score: {validation_result['fraud']['risk_score']}/100")
        print(f"     - Recommendation: {validation_result['recommendation']}")
        log_event(
            "VALIDATION",
            f"Match {validation_result['matching']['overall_score']}/100, "
            f"Risk {validation_result['fraud']['risk_score']}/100, "
            f"Recommendation {validation_result['recommendation']}"
        )
        
        # Step 4: Update invoice record
        Invoice.update(
            invoice_id,
            vendor_id=po_data['vendor_id'],
            po_number=po_number,
            grn_number=grn_data['grn_number'],
            matching_result=json.dumps(validation_result['matching']),
            fraud_result=json.dumps(validation_result['fraud']),
            recommendation=validation_result['recommendation'],
            status="COMPLETED",
            processed_at=datetime.utcnow(),
            processing_log=json.dumps(processing_events)
        )
        
        print(f"✅ Invoice {invoice_id} processing complete!\n")
        
    except Exception as e:
        print(f"  ❌ Error processing invoice: {str(e)}")
        try:
            log_event("ERROR", f"Error processing invoice: {str(e)}")
        except Exception:
            pass
        Invoice.update(
            invoice_id,
            status="FAILED",
            processing_log=json.dumps(processing_events)
        )

@router.post("/upload", response_model=UploadResponse)
async def upload_invoice(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Upload invoice PDF and start processing
    
    Returns immediately with invoice_id
    Processing happens in background
    """
    
    # Validate file type
    allowed_extensions = ['.pdf', '.png', '.jpg', '.jpeg']
    file_ext = '.' + file.filename.lower().split('.')[-1] if '.' in file.filename else ''
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Only PDF, PNG, JPEG files are supported. Got: {file_ext}"
        )
    
    # Generate invoice ID immediately
    invoice_id = str(uuid.uuid4())
    filename = file.filename
    
    # Read file bytes first (necessary for background task)
    file_bytes = await file.read()
    
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    
    # Create invoice record quickly
    initial_log = [{
        "stage": "UPLOAD",
        "message": "Invoice uploaded and queued for ADE extraction.",
        "timestamp": datetime.utcnow().isoformat()
    }]
    Invoice.create(
        invoice_id,
        status="PROCESSING",
        processing_log=json.dumps(initial_log)
    )
    
    # Process in background (extraction + validation takes ~45s)
    background_tasks.add_task(
        process_invoice_background,
        invoice_id,
        file_bytes,
        filename
    )
    
    return UploadResponse(
        invoice_id=invoice_id,
        status="PROCESSING",
        message="Invoice uploaded successfully. Processing in background."
    )

@router.get("/{invoice_id}")
async def get_invoice(invoice_id: str):
    """
    Get invoice details (for polling)
    
    Frontend polls this every 2 seconds until status = COMPLETE
    """
    
    invoice = Invoice.get(invoice_id)
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Handle both dict and object
    processing_log: List[Dict[str, Any]] = []
    
    if isinstance(invoice, dict):
        extracted_data = json.loads(invoice.get('extracted_data', 'null')) if invoice.get('extracted_data') else None
        matching_result = json.loads(invoice.get('matching_result', 'null')) if invoice.get('matching_result') else None
        fraud_result = json.loads(invoice.get('fraud_result', 'null')) if invoice.get('fraud_result') else None
        if invoice.get('processing_log'):
            try:
                processing_log = json.loads(invoice.get('processing_log', '[]'))
            except json.JSONDecodeError:
                processing_log = []
    else:
        extracted_data = json.loads(invoice.extracted_data) if invoice.extracted_data else None
        matching_result = json.loads(invoice.matching_result) if invoice.matching_result else None
        fraud_result = json.loads(invoice.fraud_result) if invoice.fraud_result else None
        if getattr(invoice, 'processing_log', None):
            try:
                processing_log = json.loads(invoice.processing_log)
            except json.JSONDecodeError:
                processing_log = []
    
    # Helper to get field from dict or object
    def get_field(obj, field):
        return obj.get(field) if isinstance(obj, dict) else getattr(obj, field, None)
    
    return {
        "invoice_id": get_field(invoice, 'invoice_id'),
        "invoice_number": get_field(invoice, 'invoice_number'),
        "vendor_id": get_field(invoice, 'vendor_id'),
        "po_number": get_field(invoice, 'po_number'),
        "status": get_field(invoice, 'status'),
        "recommendation": get_field(invoice, 'recommendation'),
        "extracted_data": extracted_data,
        "matching_result": matching_result,
        "fraud_result": fraud_result,
        "uploaded_at": get_field(invoice, 'uploaded_at') or get_field(invoice, 'created_at'),
        "processed_at": get_field(invoice, 'processed_at'),
        "processing_log": processing_log
    }

@router.get("/")
async def list_invoices():
    """
    List all invoices
    
    For dashboard display
    """
    
    invoices = Invoice.list(limit=100)
    
    def get_field(obj, field):
        return obj.get(field) if isinstance(obj, dict) else getattr(obj, field, None)
    
    items = []
    for inv in invoices:
        # Extract risk score from fraud_result
        risk_score = None
        fraud_result_str = get_field(inv, 'fraud_result')
        if fraud_result_str:
            try:
                fraud = json.loads(fraud_result_str)
                risk_score = fraud.get('risk_score')
            except:
                pass
        
        # Parse extracted_data for frontend
        extracted_data = None
        extracted_data_str = get_field(inv, 'extracted_data')
        if extracted_data_str:
            try:
                extracted_data = json.loads(extracted_data_str)
            except:
                pass
        
        # Parse matching_result and fraud_result
        matching_result = None
        matching_result_str = get_field(inv, 'matching_result')
        if matching_result_str:
            try:
                matching_result = json.loads(matching_result_str)
            except:
                pass
        
        fraud_result = None
        if fraud_result_str:
            try:
                fraud_result = json.loads(fraud_result_str)
            except:
                pass
        
        processing_log = []
        processing_log_str = get_field(inv, 'processing_log')
        if processing_log_str:
            try:
                processing_log = json.loads(processing_log_str)
            except:
                processing_log = []
        
        items.append({
            "invoice_id": get_field(inv, 'invoice_id'),
            "invoice_number": get_field(inv, 'invoice_number'),
            "vendor_id": get_field(inv, 'vendor_id'),
            "status": get_field(inv, 'status'),
            "recommendation": get_field(inv, 'recommendation'),
            "risk_score": risk_score,
            "extracted_data": extracted_data,
            "matching_result": matching_result,
            "fraud_result": fraud_result,
            "uploaded_at": get_field(inv, 'uploaded_at') or get_field(inv, 'created_at'),
            "processed_at": get_field(inv, 'processed_at'),
            "processing_log": processing_log
        })
    
    return {
        "invoices": items,
        "count": len(items)
    }

@router.delete("/{invoice_id}")
async def delete_invoice(invoice_id: str):
    """Delete an invoice"""
    
    invoice = Invoice.get(invoice_id)
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    Invoice.delete(invoice_id)
    
    return {"message": "Invoice deleted successfully"}
