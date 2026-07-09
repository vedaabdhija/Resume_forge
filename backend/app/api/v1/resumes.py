from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Response
from sqlalchemy.orm import Session
from typing import List, Any
import os
import uuid
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.models import User, Resume
from app.schemas.schemas import ResumeResponse
from app.services.parser_service import ParserService
from app.core.logging import logger

router = APIRouter()

# Ensure uploads directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Uploads a resume file (PDF, DOCX, TXT), extracts text and metadata, and saves to database."""
    contents = await file.read()
    filename = file.filename or "resume.pdf"
    
    # 1. Size Validation (Max 10MB)
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File is too large. Max size is 10MB.")
        
    # 2. Format Verification and Text Extraction
    text = ""
    if filename.endswith(".pdf"):
        text = ParserService.extract_text_from_pdf(contents)
    elif filename.endswith(".docx"):
        text = ParserService.extract_text_from_docx(contents)
    elif filename.endswith(".txt"):
        text = contents.decode("utf-8", errors="ignore")
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a PDF, DOCX, or TXT file."
        )
        
    if not text.strip() or "Error extracting" in text:
        raise HTTPException(
            status_code=400,
            detail="Failed to parse resume text. The document might be scanned or empty."
        )
        
    # 3. Save file to disk
    unique_filename = f"{uuid.uuid4()}_{filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    try:
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        logger.error(f"Failed to save file to disk: {str(e)}")
        file_path = None
        
    # 4. Parse text into structured fields using Heuristics/AI parser
    parsed_json = ParserService.parse_resume_to_json(text)
    
    # 5. Save to Database
    db_resume = Resume(
        user_id=current_user.id,
        title=title,
        original_text=text,
        parsed_json=parsed_json,
        file_path=file_path
    )
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)
    
    logger.info(f"User {current_user.id} uploaded resume '{title}' successfully.")
    return db_resume

@router.get("/", response_model=List[ResumeResponse])
def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Lists all resumes for the authenticated user."""
    return db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).all()

@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Gets details for a single resume."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume

@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> None:
    """Deletes a resume."""
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    db.delete(resume)
    db.commit()
    return None
