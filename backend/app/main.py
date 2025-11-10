"""
Invoice³ FastAPI Application

Author: Subash Natarajan
LinkedIn: https://www.linkedin.com/in/subashn/
Email: suboss87@gmail.com

Built for LandingAI Financial Hackathon 2024
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import config
from app.database import init_database
from app.api import invoices
# from app.api import chat  # Disabled - RAG dependencies cause issues
from datetime import datetime
import uvicorn

# Initialize FastAPI app
app = FastAPI(
    title="Invoice³ API",
    description="AI-Powered Invoice 3-Way Matching & Fraud Detection",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        config.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(invoices.router, prefix="/api/invoices", tags=["Invoices"])
# Chat API disabled for production - RAG dependencies cause issues
# app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

@app.on_event("startup")
async def startup_event():
    """Initialize app on startup"""
    print("\n" + "="*60)
    print("🚀 Starting Invoice³ API v3.0.0")
    print("="*60)
    
    # Validate configuration
    try:
        config.validate()
        print("✅ Configuration validated")
    except Exception as e:
        print(f"❌ Configuration error: {str(e)}")
        print("⚠️ Some features may not work properly")
    
    # Initialize database
    try:
        init_database()
        print("✅ Database initialized")
    except Exception as e:
        print(f"❌ Database error: {str(e)}")
    
    print("\n📊 API Documentation:")
    print(f"   - Swagger UI: http://localhost:8000/docs")
    print(f"   - ReDoc: http://localhost:8000/redoc")
    print("\n✨ Ready to process invoices!")
    print("="*60 + "\n")

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Invoice³ API v3.0",
        "description": "AI-Powered Invoice 3-Way Matching & Fraud Detection",
        "version": "3.0.0",
        "status": "running",
        "docs": "/docs",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "3.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "api": "running",
            "database": "connected",
            "ade": "configured" if config.LANDING_AI_API_KEY else "not_configured",
            "llm": "configured" if config.GEMINI_API_KEY else "not_configured"
        }
    }

@app.get("/api/stats")
def get_stats_endpoint():
    """Get system statistics"""
    from app.db_interface import get_stats
    return get_stats()

if __name__ == "__main__":
    # Run with: python -m app.main
    # Or: uvicorn app.main:app --reload
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

