import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, JSON, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="user") # 'user' or 'admin'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("ApplicationTracker", back_populates="user", cascade="all, delete-orphan")
    skills = relationship("SkillTracker", back_populates="user", cascade="all, delete-orphan")

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    original_text = Column(Text, nullable=False)
    parsed_json = Column(JSON, nullable=True)  # Name, contact, experience, skills, education
    file_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="resumes")
    tailored = relationship("TailoredResume", back_populates="resume", cascade="all, delete-orphan")
    cover_letters = relationship("CoverLetter", back_populates="resume", cascade="all, delete-orphan")
    applications = relationship("ApplicationTracker", back_populates="resume")

class JobDescription(Base):
    __tablename__ = "job_descriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=True)
    company = Column(String, nullable=True)
    description_text = Column(Text, nullable=False)
    parsed_json = Column(JSON, nullable=True)  # Required/preferred skills, responsibilities, etc.
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    tailored = relationship("TailoredResume", back_populates="job", cascade="all, delete-orphan")

class TailoredResume(Base):
    __tablename__ = "tailored_resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False)
    
    # AI optimization content
    tailored_text = Column(Text, nullable=True)
    tailored_json = Column(JSON, nullable=True)
    template_name = Column(String, default="professional")  # tech, minimal, professional
    file_path = Column(String, nullable=True)  # Stores tailored DOCX file path if uploaded as docx
    
    # Asynchronous job tracking
    status = Column(String, default="PENDING")  # PENDING, RUNNING, COMPLETED, FAILED
    progress = Column(Integer, default=0)       # 0 to 100
    error_message = Column(Text, nullable=True)
    
    # Explainable ATS Score data
    ats_score = Column(Float, default=0.0)      # Composite score
    ats_analysis = Column(JSON, nullable=True)  # Category scores: formatting, keywords, readability, verb impact
    
    # Fact Verification results
    fact_verification = Column(JSON, nullable=True)  # Lists categorized: VERIFIED, SIMILAR, UNSUPPORTED
    
    # AI Metadata tracking
    ai_metadata = Column(JSON, nullable=True)  # prompt_version, model_name, timestamp, settings
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    resume = relationship("Resume", back_populates="tailored")
    job = relationship("JobDescription", back_populates="tailored")
    applications = relationship("ApplicationTracker", back_populates="tailored_resume")

class CoverLetter(Base):
    __tablename__ = "cover_letters"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    ai_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    resume = relationship("Resume", back_populates="cover_letters")

class InterviewPrep(Base):
    __tablename__ = "interview_preps"
    
    id = Column(Integer, primary_key=True, index=True)
    tailored_resume_id = Column(Integer, ForeignKey("tailored_resumes.id", ondelete="CASCADE"), nullable=False)
    questions = Column(JSON, nullable=False)  # List of {category, question, answer}
    ai_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class SkillTracker(Base):
    __tablename__ = "skill_tracker"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String, nullable=False)
    category = Column(String, default="technical") # technical, soft, tools
    proficiency = Column(String, default="beginner") # beginner, intermediate, advanced
    roadmap = Column(JSON, nullable=True) # Recommended projects, courses, books
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="skills")

class ApplicationTracker(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    tailored_resume_id = Column(Integer, ForeignKey("tailored_resumes.id", ondelete="SET NULL"), nullable=True)
    
    company = Column(String, nullable=False)
    role = Column(String, nullable=False)
    status = Column(String, default="wishlist") # wishlist, applied, interview, offer, rejected
    interview_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="applications")
    resume = relationship("Resume", back_populates="applications")
    tailored_resume = relationship("TailoredResume", back_populates="applications")
