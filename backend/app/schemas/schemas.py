from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Authentication Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# --- Resume Schemas ---
class ResumeCreate(BaseModel):
    title: str
    original_text: str

class ResumeResponse(BaseModel):
    id: int
    user_id: int
    title: str
    original_text: str
    parsed_json: Optional[Dict[str, Any]] = None
    file_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Job Description Schemas ---
class JobDescriptionCreate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    description_text: str

class JobDescriptionResponse(BaseModel):
    id: int
    title: Optional[str] = None
    company: Optional[str] = None
    description_text: str
    parsed_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Tailor / Optimization Schemas ---
class TailorResumeRequest(BaseModel):
    resume_id: int
    job_description_text: str
    company_name: Optional[str] = None
    job_title: Optional[str] = None

class TailoredResumeStatusResponse(BaseModel):
    id: int
    status: str
    progress: int
    error_message: Optional[str] = None

    class Config:
        from_attributes = True

class TailoredResumeResponse(BaseModel):
    id: int
    resume_id: int
    job_id: int
    tailored_text: Optional[str] = None
    tailored_json: Optional[Dict[str, Any]] = None
    template_name: str
    status: str
    progress: int
    ats_score: float
    ats_analysis: Optional[Dict[str, Any]] = None
    fact_verification: Optional[Dict[str, Any]] = None
    ai_metadata: Optional[Dict[str, Any]] = None
    file_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Cover Letter Schemas ---
class CoverLetterResponse(BaseModel):
    id: int
    resume_id: int
    job_id: int
    content: str
    ai_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Interview Prep Schemas ---
class InterviewPrepResponse(BaseModel):
    id: int
    tailored_resume_id: int
    questions: List[Dict[str, Any]]
    ai_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Skill Tracker Schemas ---
class SkillTrackerCreate(BaseModel):
    skill_name: str
    category: Optional[str] = "technical"
    proficiency: Optional[str] = "beginner"

class SkillTrackerResponse(BaseModel):
    id: int
    user_id: int
    skill_name: str
    category: str
    proficiency: str
    roadmap: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Application Tracker Schemas ---
class ApplicationCreate(BaseModel):
    company: str
    role: str
    status: Optional[str] = "wishlist"
    resume_id: Optional[int] = None
    tailored_resume_id: Optional[int] = None
    notes: Optional[str] = None
    interview_date: Optional[datetime] = None

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    interview_date: Optional[datetime] = None

class ApplicationResponse(BaseModel):
    id: int
    user_id: int
    resume_id: Optional[int] = None
    tailored_resume_id: Optional[int] = None
    company: str
    role: str
    status: str
    interview_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Analytics Response ---
class AnalyticsResponse(BaseModel):
    total_applications: int
    status_counts: Dict[str, int]
    avg_ats_score: float
    ats_score_history: List[Dict[str, Any]]
    skills_gap: List[str]
    recent_activity: List[Dict[str, Any]]
