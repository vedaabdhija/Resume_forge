import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "ResumeForge AI"
    API_V1_STR: str = "/api/v1"
    
    # JWT & Auth
    SECRET_KEY: str = "supersecretkeychangeinproduction"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # Database
    # Default to sqlite inside the project directory for ease of setup
    DATABASE_URL: str = "sqlite:///./resumeforge.db"
    
    # AI Keys
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
    
    # Demo Mode Config
    # If True or if API keys are missing, the system will fall back to static/heuristic responses
    DEMO_MODE: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

# Auto-enable demo mode if keys are not present
if not settings.GEMINI_API_KEY and not settings.OPENAI_API_KEY:
    settings.DEMO_MODE = True
