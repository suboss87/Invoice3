"""
Configuration management for Invoice³
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration"""
    
    # API Keys
    LANDING_AI_API_KEY = os.getenv('LANDING_AI_API_KEY', '')
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    
    # Database
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./invoice3.db')
    
    # Environment
    ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
    DEBUG = os.getenv('DEBUG', 'true').lower() == 'true'
    
    # CORS
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    
    # LandingAI endpoints
    LANDING_AI_BASE_URL = "https://api.va.landing.ai/v1/ade"
    
    @classmethod
    def validate(cls):
        """Validate required configuration"""
        required = ['LANDING_AI_API_KEY', 'GEMINI_API_KEY']
        missing = [key for key in required if not getattr(cls, key)]
        if missing:
            raise ValueError(f"Missing required config: {', '.join(missing)}")
        return True

config = Config()

