import time
import os
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status, Response
from sqlalchemy.orm import Session
from typing import Any, List, Dict
from app.core.database import get_db, SessionLocal
from app.api.v1.auth import get_current_user
from app.models.models import User, Resume, JobDescription, TailoredResume, CoverLetter, InterviewPrep
from app.schemas.schemas import TailorResumeRequest, TailoredResumeResponse, TailoredResumeStatusResponse
from app.services.ai_service import AIService
from app.services.vector_service import VectorService
from app.services.pdf_service import PDFService
from app.services.docx_service import DocxService
from app.core.logging import logger

router = APIRouter()

def run_async_tailoring_pipeline(tailored_id: int, resume_id: int, job_text: str, company: str, title: str):
    """
    Executes the optimization pipeline as a background task.
    Updates the database with progress logs.
    """
    db_session = SessionLocal()
    try:
        # Step 1: Initialize Job & Parse Description
        logger.info(f"Starting async tailoring pipeline for tailored_id={tailored_id}")
        db_tailored = db_session.query(TailoredResume).filter(TailoredResume.id == tailored_id).first()
        if not db_tailored:
            return
            
        db_tailored.status = "RUNNING"
        db_tailored.progress = 10
        db_session.commit()
        
        # Parse job description
        job_info = AIService.parse_job_description(job_text)
        if company:
            job_info["company"] = company
        if title:
            job_info["title"] = title
            
        db_job = JobDescription(
            title=job_info.get("title"),
            company=job_info.get("company"),
            description_text=job_text,
            parsed_json=job_info
        )
        db_session.add(db_job)
        db_session.commit()
        db_session.refresh(db_job)
        
        db_tailored.job_id = db_job.id
        db_tailored.progress = 30
        db_session.commit()
        
        # Step 2: RAG Retrieval
        db_resume = db_session.query(Resume).filter(Resume.id == resume_id).first()
        if not db_resume:
            raise ValueError("Base resume not found")
            
        resume_json = db_resume.parsed_json or {}
        chunks = VectorService.chunk_resume(resume_json)
        keywords_query = " ".join(job_info.get("keywords", []))
        relevant_chunks = VectorService.retrieve_relevant_chunks(chunks, keywords_query, top_k=5)
        
        db_tailored.progress = 50
        db_session.commit()
        
        # Step 3: Run AI Optimization
        tailored_results = AIService.tailor_resume(resume_json, relevant_chunks, job_info)
        
        db_tailored.tailored_text = json_to_text_format(tailored_results["tailored_json"])
        db_tailored.tailored_json = tailored_results["tailored_json"]
        db_tailored.ats_score = tailored_results["ats_score"]
        db_tailored.ats_analysis = tailored_results["ats_analysis"]
        db_tailored.fact_verification = tailored_results["fact_verification"]
        db_tailored.ai_metadata = tailored_results["ai_metadata"]
        
        # In-place DOCX tailoring if original file was docx
        if db_resume.file_path and db_resume.file_path.endswith(".docx"):
            unique_tailored_filename = f"tailored_{tailored_id}_{os.path.basename(db_resume.file_path)}"
            tailored_docx_path = os.path.join("uploads", unique_tailored_filename)
            success = DocxService.tailor_docx_in_place(
                db_resume.file_path,
                tailored_docx_path,
                resume_json,
                tailored_results["tailored_json"]
            )
            if success:
                db_tailored.file_path = tailored_docx_path
        
        db_tailored.progress = 80
        db_session.commit()
        
        # Step 4: Generate related Cover Letter and Interview Questions
        cover_letter_data = AIService.generate_cover_letter(resume_json, job_info)
        db_cover_letter = CoverLetter(
            resume_id=resume_id,
            job_id=db_job.id,
            content=cover_letter_data["content"],
            ai_metadata=cover_letter_data["ai_metadata"]
        )
        db_session.add(db_cover_letter)
        
        interview_qa = AIService.generate_interview_questions(tailored_results["tailored_json"], job_info)
        db_interview = InterviewPrep(
            tailored_resume_id=tailored_id,
            questions=interview_qa,
            ai_metadata=tailored_results["ai_metadata"]
        )
        db_session.add(db_interview)
        
        db_tailored.progress = 100
        db_tailored.status = "COMPLETED"
        db_session.commit()
        logger.info(f"Async tailoring completed successfully for tailored_id={tailored_id}")
        
    except Exception as e:
        logger.error(f"Tailoring pipeline failed: {str(e)}")
        db_tailored = db_session.query(TailoredResume).filter(TailoredResume.id == tailored_id).first()
        if db_tailored:
            db_tailored.status = "FAILED"
            db_tailored.error_message = str(e)
            db_session.commit()
    finally:
        db_session.close()

def json_to_text_format(resume_json: Dict[str, Any]) -> str:
    """Converts resume JSON back to formatted readable markdown/text."""
    text_blocks = []
    text_blocks.append(f"{resume_json.get('name', '')}\n{resume_json.get('email', '')} | {resume_json.get('phone', '')}\n")
    
    skills = resume_json.get("skills", [])
    if skills:
        text_blocks.append(f"SKILLS\n{', '.join(skills)}\n")
        
    text_blocks.append("EXPERIENCE")
    for job in resume_json.get("experience", []):
        text_blocks.append(f"{job.get('role')} at {job.get('company')} ({job.get('duration')})")
        for h in job.get("highlights", []):
            text_blocks.append(f"- {h}")
        text_blocks.append("")
        
    text_blocks.append("EDUCATION")
    for edu in resume_json.get("education", []):
        text_blocks.append(edu.get("institution_or_degree", ""))
        
    return "\n".join(text_blocks)


@router.post("/", response_model=TailoredResumeStatusResponse, status_code=status.HTTP_202_ACCEPTED)
def start_tailoring(
    req: TailorResumeRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Submits a resume tailoring request.
    Creates a pending project record and schedules the async tailoring background pipeline.
    """
    resume = db.query(Resume).filter(Resume.id == req.resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    # Create empty TailoredResume placeholder
    db_tailored = TailoredResume(
        resume_id=req.resume_id,
        job_id=0, # Will be set by background thread
        status="PENDING",
        progress=0
    )
    db.add(db_tailored)
    db.commit()
    db.refresh(db_tailored)
    
    # Run pipeline in background thread
    background_tasks.add_task(
        run_async_tailoring_pipeline,
        tailored_id=db_tailored.id,
        resume_id=req.resume_id,
        job_text=req.job_description_text,
        company=req.company_name or "",
        title=req.job_title or ""
    )
    
    return db_tailored

@router.get("/{tailored_id}/status", response_model=TailoredResumeStatusResponse)
def get_tailoring_status(
    tailored_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Gets the async pipeline execution status and progress percentage."""
    tailored = db.query(TailoredResume).join(Resume).filter(
        TailoredResume.id == tailored_id,
        Resume.user_id == current_user.id
    ).first()
    
    if not tailored:
        raise HTTPException(status_code=404, detail="Tailoring project not found")
        
    return tailored

@router.get("/{tailored_id}", response_model=TailoredResumeResponse)
def get_tailored_resume(
    tailored_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Fetches details for a tailored resume (diffs, fact verification checklist, ATS scoring)."""
    tailored = db.query(TailoredResume).join(Resume).filter(
        TailoredResume.id == tailored_id,
        Resume.user_id == current_user.id
    ).first()
    
    if not tailored:
        raise HTTPException(status_code=404, detail="Tailoring project not found")
        
    return tailored

@router.get("/{tailored_id}/download-pdf")
def download_tailored_pdf(
    tailored_id: int,
    template: str = "professional",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Generates and downloads the PDF version of the tailored resume using the requested layout style."""
    tailored = db.query(TailoredResume).join(Resume).filter(
        TailoredResume.id == tailored_id,
        Resume.user_id == current_user.id
    ).first()
    
    if not tailored or not tailored.tailored_json:
        raise HTTPException(status_code=404, detail="Tailored resume data is not ready or not found")
        
    pdf_bytes = PDFService.generate_resume_pdf(tailored.tailored_json, template_name=template)
    
    filename = f"tailored_resume_{tailored_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@router.get("/{tailored_id}/download-docx")
def download_tailored_docx(
    tailored_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Downloads the tailored DOCX version of the resume if it was uploaded as a DOCX."""
    tailored = db.query(TailoredResume).join(Resume).filter(
        TailoredResume.id == tailored_id,
        Resume.user_id == current_user.id
    ).first()
    
    if not tailored or not tailored.file_path or not os.path.exists(tailored.file_path):
        raise HTTPException(status_code=404, detail="Tailored DOCX resume file not found or not ready")
        
    filename = os.path.basename(tailored.file_path)
    # Remove the unique prefix from the download file name for a clean download name
    if "_" in filename:
        filename = filename.split("_", 1)[1]
        
    with open(tailored.file_path, "rb") as f:
        file_bytes = f.read()
        
    return Response(
        content=file_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
