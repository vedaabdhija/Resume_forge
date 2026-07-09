from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List, Any
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.models import User, ApplicationTracker
from app.schemas.schemas import ApplicationCreate, ApplicationUpdate, ApplicationResponse

router = APIRouter()

@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    app_in: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Adds a new job application to the tracking board."""
    db_app = ApplicationTracker(
        user_id=current_user.id,
        resume_id=app_in.resume_id,
        tailored_resume_id=app_in.tailored_resume_id,
        company=app_in.company,
        role=app_in.role,
        status=app_in.status or "wishlist",
        notes=app_in.notes,
        interview_date=app_in.interview_date
    )
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app

@router.get("/", response_model=List[ApplicationResponse])
def list_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieves all application tracker entries for the current user."""
    return db.query(ApplicationTracker).filter(ApplicationTracker.user_id == current_user.id).order_by(ApplicationTracker.created_at.desc()).all()

@router.put("/{app_id}", response_model=ApplicationResponse)
def update_application(
    app_id: int,
    app_in: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Updates status, notes, or interview dates for a specific application."""
    db_app = db.query(ApplicationTracker).filter(ApplicationTracker.id == app_id, ApplicationTracker.user_id == current_user.id).first()
    if not db_app:
        raise HTTPException(status_code=404, detail="Application tracker entry not found")
        
    update_data = app_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_app, field, value)
        
    db.commit()
    db.refresh(db_app)
    return db_app

@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_application(
    app_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> None:
    """Deletes an application entry from the tracker."""
    db_app = db.query(ApplicationTracker).filter(ApplicationTracker.id == app_id, ApplicationTracker.user_id == current_user.id).first()
    if not db_app:
        raise HTTPException(status_code=404, detail="Application tracker entry not found")
    db.delete(db_app)
    db.commit()
    return None
