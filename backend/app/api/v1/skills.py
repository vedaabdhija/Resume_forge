from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.models import User, SkillTracker, TailoredResume
from app.schemas.schemas import SkillTrackerCreate, SkillTrackerResponse
from app.services.ai_service import AIService

router = APIRouter()

@router.post("/", response_model=SkillTrackerResponse, status_code=status.HTTP_201_CREATED)
def create_skill(
    skill_in: SkillTrackerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Adds a new skill to the user's tracking list, generating a career recommendation roadmap."""
    # Auto-generate custom roadmap using career coach simulation
    coach_data = AIService.generate_career_coach({"skills": [skill_in.skill_name]}, [skill_in.skill_name])
    
    db_skill = SkillTracker(
        user_id=current_user.id,
        skill_name=skill_in.skill_name,
        category=skill_in.category or "technical",
        proficiency=skill_in.proficiency or "beginner",
        roadmap=coach_data
    )
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)
    return db_skill

@router.get("/", response_model=List[SkillTrackerResponse])
def list_skills(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Lists all skills being tracked by the user."""
    return db.query(SkillTracker).filter(SkillTracker.user_id == current_user.id).all()

@router.post("/generate-roadmap/{tailored_id}", response_model=List[SkillTrackerResponse])
def generate_roadmap_from_gaps(
    tailored_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Automatically parses skill gaps from a tailored resume and creates a set of tracking roadmaps."""
    tailored = db.query(TailoredResume).filter(TailoredResume.id == tailored_id).first()
    if not tailored or not tailored.fact_verification:
        raise HTTPException(status_code=404, detail="Tailored resume fact-verification report not found")
        
    gaps = [item["item"] for item in tailored.fact_verification.get("unsupported_items", [])]
    
    created_skills = []
    for skill_name in gaps:
        # Check if already tracking
        existing = db.query(SkillTracker).filter(
            SkillTracker.user_id == current_user.id,
            SkillTracker.skill_name == skill_name
        ).first()
        if existing:
            created_skills.append(existing)
            continue
            
        coach_data = AIService.generate_career_coach({"skills": [skill_name]}, [skill_name])
        db_skill = SkillTracker(
            user_id=current_user.id,
            skill_name=skill_name,
            category="technical",
            proficiency="beginner",
            roadmap=coach_data
        )
        db.add(db_skill)
        created_skills.append(db_skill)
        
    db.commit()
    return created_skills
