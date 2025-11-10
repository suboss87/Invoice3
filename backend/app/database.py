"""
Database models and session management
"""
from sqlalchemy import create_engine, Column, String, Float, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# Get database URL from environment or use default
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./invoice3.db')

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if 'sqlite' in DATABASE_URL else {}
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Database Models
class Vendor(Base):
    """Vendor information and history"""
    __tablename__ = "vendors"
    
    vendor_id = Column(String, primary_key=True)
    vendor_name = Column(String, nullable=False)
    tax_id = Column(String)
    bank_account = Column(String)
    routing_number = Column(String)
    bank_name = Column(String)
    address = Column(Text)
    contact_email = Column(String)
    contact_phone = Column(String)
    invoice_history = Column(Text)  # JSON
    risk_profile = Column(Text)  # JSON
    created_at = Column(DateTime, default=datetime.utcnow)

class PurchaseOrder(Base):
    """Purchase order data"""
    __tablename__ = "purchase_orders"
    
    po_number = Column(String, primary_key=True)
    vendor_id = Column(String, nullable=False)
    vendor_name = Column(String)
    po_date = Column(String)
    total = Column(Float)
    currency = Column(String, default='USD')
    line_items = Column(Text)  # JSON array
    payment_terms = Column(String)
    delivery_terms = Column(String)
    status = Column(String, default='APPROVED')
    created_at = Column(DateTime, default=datetime.utcnow)

class GoodsReceipt(Base):
    """Goods receipt note data"""
    __tablename__ = "goods_receipts"
    
    grn_number = Column(String, primary_key=True)
    po_number = Column(String, nullable=False)
    vendor_id = Column(String)
    delivery_date = Column(String)
    received_items = Column(Text)  # JSON array
    inspector = Column(String)
    notes = Column(Text)
    status = Column(String, default='RECEIVED')
    created_at = Column(DateTime, default=datetime.utcnow)

class Invoice(Base):
    """Invoice processing records"""
    __tablename__ = "invoices"
    
    invoice_id = Column(String, primary_key=True)
    invoice_number = Column(String)
    vendor_id = Column(String)
    po_number = Column(String)
    grn_number = Column(String)
    extracted_data = Column(Text)    # JSON (45 fields)
    matching_result = Column(Text)   # JSON
    fraud_result = Column(Text)      # JSON
    recommendation = Column(String)  # APPROVE/REVIEW/REJECT
    status = Column(String, default='PROCESSING')
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime)
    processing_log = Column(Text)    # JSON array of processing events

class ChatMessage(Base):
    """Chat Q&A history"""
    __tablename__ = "chat_messages"
    
    message_id = Column(String, primary_key=True)
    invoice_id = Column(String)
    question = Column(Text)
    answer = Column(Text)
    sub_queries = Column(Text)  # JSON array
    citations = Column(Text)    # JSON array
    created_at = Column(DateTime, default=datetime.utcnow)

# Create all tables
def init_database():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")

def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Initialize on import
if __name__ == "__main__":
    init_database()
