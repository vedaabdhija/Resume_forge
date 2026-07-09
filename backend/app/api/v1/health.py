from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import datetime
from app.core.database import get_db
from app.services.ai_service import AIService
from app.core.config import settings
from typing import Dict, Any

router = APIRouter()

@router.get("/")
def check_health(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Checks the status of the database connection and the active AI engine.
    Used for uptime checking and verification logs.
    """
    # 1. Test database ping
    db_status = "healthy"
    try:
        db.execute("SELECT 1")
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
        
    # 2. Check active AI Model configurations
    ai_info = AIService.get_model_info()
    
    return {
        "status": "online",
        "database": db_status,
        "ai_engine": ai_info,
        "demo_mode": settings.DEMO_MODE,
        "time": datetime.datetime.utcnow().isoformat()
    }
