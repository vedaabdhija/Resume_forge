from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.models import User, InterviewPrep
from app.schemas.schemas import InterviewPrepResponse

router = APIRouter()

@router.get("/{tailored_resume_id}", response_model=InterviewPrepResponse)
def get_interview_prep(
    tailored_resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches interview preparation questions and answers generated for a tailored resume."""
    prep = db.query(InterviewPrep).filter(InterviewPrep.tailored_resume_id == tailored_resume_id).first()
    if not prep:
        raise HTTPException(status_code=404, detail="Interview preparation questions not found for this resume")
    return prep
