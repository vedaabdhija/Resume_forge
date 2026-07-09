from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.models import User, ApplicationTracker, TailoredResume, SkillTracker
from app.schemas.schemas import AnalyticsResponse
from typing import Any

router = APIRouter()

@router.get("/", response_model=AnalyticsResponse)
def get_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Aggregates tracker metrics and historical ATS optimizations for dashboard rendering."""
    # 1. Total applications & column counts
    apps = db.query(ApplicationTracker).filter(ApplicationTracker.user_id == current_user.id).all()
    total_apps = len(apps)
    
    status_counts = {
        "wishlist": 0,
        "applied": 0,
        "interview": 0,
        "offer": 0,
        "rejected": 0
    }
    for app in apps:
        status_counts[app.status] = status_counts.get(app.status, 0) + 1
        
    # 2. Avg ATS score and score history
    tailored = db.query(TailoredResume).join(ApplicationTracker, ApplicationTracker.tailored_resume_id == TailoredResume.id).filter(
        ApplicationTracker.user_id == current_user.id,
        TailoredResume.status == "COMPLETED"
    ).all()
    
    avg_ats = 0.0
    ats_history = []
    if tailored:
        total_score = 0.0
        for item in tailored:
            total_score += item.ats_score
            ats_history.append({
                "date": item.created_at.strftime("%Y-%m-%d"),
                "score": item.ats_score,
                "company": item.job.company if item.job else "Tech Job"
            })
        avg_ats = round(total_score / len(tailored), 1)
        
    # Sort history chronologically
    ats_history.sort(key=lambda x: x["date"])
    
    # 3. Missing skills gap from skill trackers
    skills = db.query(SkillTracker).filter(SkillTracker.user_id == current_user.id).all()
    skills_gap = [s.skill_name for s in skills if s.proficiency == "beginner"]
    
    # 4. Recent activities list
    recent_activity = []
    # Fetch recent job trackers
    for app in apps[:4]:
        recent_activity.append({
            "type": "application",
            "message": f"Added/Updated application for {app.role} at {app.company}.",
            "timestamp": app.updated_at.strftime("%Y-%m-%d %H:%M")
        })
    # Fetch recent resume tailings
    for item in tailored[:3]:
        recent_activity.append({
            "type": "tailoring",
            "message": f"Optimized resume for {item.job.title if item.job else 'Position'} with ATS score {item.ats_score}.",
            "timestamp": item.created_at.strftime("%Y-%m-%d %H:%M")
        })
        
    # Sort by timestamp desc
    recent_activity.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {
        "total_applications": total_apps,
        "status_counts": status_counts,
        "avg_ats_score": avg_ats,
        "ats_score_history": ats_history[:10],
        "skills_gap": skills_gap[:6],
        "recent_activity": recent_activity[:6]
    }
