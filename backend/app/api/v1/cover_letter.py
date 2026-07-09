from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.models import User, CoverLetter
from app.schemas.schemas import CoverLetterResponse

router = APIRouter()

@router.get("/{job_id}", response_model=CoverLetterResponse)
def get_cover_letter(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches a tailored cover letter generated for the specified job."""
    cover_letter = db.query(CoverLetter).filter(CoverLetter.job_id == job_id).first()
    if not cover_letter:
        raise HTTPException(status_code=404, detail="Cover letter not found for this job")
    return cover_letter
