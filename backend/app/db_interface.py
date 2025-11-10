"""
Local SQLite database interface for Invoice³
"""
from typing import Optional, List, Dict, Any
from app.database import (
    SessionLocal,
    Invoice as InvoiceModel,
    PurchaseOrder as POModel,
    GoodsReceipt as GRNModel,
    Vendor as VendorModel,
)

print("🟢 Using SQLite adapter")

# ========================================
# Unified Interface
# ========================================

class Invoice:
    """Unified Invoice interface"""
    
    @staticmethod
    def create(invoice_id: str, **kwargs):
        session = SessionLocal()
        try:
            invoice = InvoiceModel(invoice_id=invoice_id, **kwargs)
            session.add(invoice)
            session.commit()
            session.refresh(invoice)
            return invoice
        finally:
            session.close()
    
    @staticmethod
    def get(invoice_id: str):
        session = SessionLocal()
        try:
            return session.query(InvoiceModel).filter_by(invoice_id=invoice_id).first()
        finally:
            session.close()
    
    @staticmethod
    def update(invoice_id: str, **kwargs):
        session = SessionLocal()
        try:
            invoice = session.query(InvoiceModel).filter_by(invoice_id=invoice_id).first()
            if invoice:
                for key, value in kwargs.items():
                    setattr(invoice, key, value)
                session.commit()
                session.refresh(invoice)
            return invoice
        finally:
            session.close()
    
    @staticmethod
    def list(limit: int = 100):
        session = SessionLocal()
        try:
            return session.query(InvoiceModel).order_by(InvoiceModel.uploaded_at.desc()).limit(limit).all()
        finally:
            session.close()
    
    @staticmethod
    def delete(invoice_id: str):
        session = SessionLocal()
        try:
            invoice = session.query(InvoiceModel).filter_by(invoice_id=invoice_id).first()
            if invoice:
                session.delete(invoice)
                session.commit()
        finally:
            session.close()

class PurchaseOrder:
    """Unified PurchaseOrder interface"""
    
    @staticmethod
    def get(po_number: str):
        session = SessionLocal()
        try:
            return session.query(POModel).filter_by(po_number=po_number).first()
        finally:
            session.close()
    
    @staticmethod
    def create(po_number: str, **kwargs):
        session = SessionLocal()
        try:
            po = POModel(po_number=po_number, **kwargs)
            session.add(po)
            session.commit()
            session.refresh(po)
            return po
        finally:
            session.close()

class GoodsReceipt:
    """Unified GoodsReceipt interface"""
    
    @staticmethod
    def get(grn_number: str):
        session = SessionLocal()
        try:
            return session.query(GRNModel).filter_by(grn_number=grn_number).first()
        finally:
            session.close()

    @staticmethod
    def get_by_po_number(po_number: str):
        session = SessionLocal()
        try:
            return session.query(GRNModel).filter_by(po_number=po_number).first()
        finally:
            session.close()
    
    @staticmethod
    def create(grn_number: str, **kwargs):
        session = SessionLocal()
        try:
            grn = GRNModel(grn_number=grn_number, **kwargs)
            session.add(grn)
            session.commit()
            session.refresh(grn)
            return grn
        finally:
            session.close()

class Vendor:
    """Unified Vendor interface"""
    
    @staticmethod
    def get(vendor_id: str):
        session = SessionLocal()
        try:
            return session.query(VendorModel).filter_by(vendor_id=vendor_id).first()
        finally:
            session.close()
    
    @staticmethod
    def create(vendor_id: str, **kwargs):
        session = SessionLocal()
        try:
            vendor = VendorModel(vendor_id=vendor_id, **kwargs)
            session.add(vendor)
            session.commit()
            session.refresh(vendor)
            return vendor
        finally:
            session.close()

def get_stats():
    """Get system statistics"""
    session = SessionLocal()
    try:
        total = session.query(InvoiceModel).count()
        completed = session.query(InvoiceModel).filter(InvoiceModel.status == "COMPLETED").count()
        processing_statuses = ["UPLOADED", "PROCESSING", "EXTRACTING", "MATCHING", "FRAUD_CHECK"]
        processing = session.query(InvoiceModel).filter(InvoiceModel.status.in_(processing_statuses)).count()
        failure_statuses = ["FAILED", "NO_PO_NUMBER", "NO_PO_FOUND", "NO_GRN_FOUND", "NO_VENDOR_FOUND"]
        failed = session.query(InvoiceModel).filter(InvoiceModel.status.in_(failure_statuses)).count()
        return {
            'total_invoices': total,
            'completed': completed,
            'processing': processing,
            'failed': failed
        }
    finally:
        session.close()
