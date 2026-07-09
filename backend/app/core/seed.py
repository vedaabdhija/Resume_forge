from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.models import User, Resume, JobDescription, TailoredResume, CoverLetter, InterviewPrep, SkillTracker, ApplicationTracker
from app.core.logging import logger
import datetime

def seed_db():
    db = SessionLocal()
    try:
        # Check if demo user already exists
        demo_email = "demo@resumeforge.ai"
        existing_user = db.query(User).filter(User.email == demo_email).first()
        if existing_user:
            return
            
        logger.info("Database is empty. Initiating data seeding for Demo Mode...")
        
        # 1. Create Demo User
        hashed_password = get_password_hash("password123")
        user = User(
            email=demo_email,
            hashed_password=hashed_password,
            full_name="Demo Account",
            role="user",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # 2. Create Master Resume
        parsed_resume = {
            "name": "Demo Applicant",
            "email": "demo@resumeforge.ai",
            "phone": "123-456-7890",
            "github": "https://github.com/demoapplicant",
            "linkedin": "https://linkedin.com/in/demoapplicant",
            "skills": ["React", "TypeScript", "Node.js", "Python", "SQL", "Git", "TailwindCSS"],
            "experience": [
                {
                    "role": "Software Engineer",
                    "company": "InnovateTech",
                    "duration": "2024 - Present",
                    "highlights": [
                        "Collaborated with backend teams to integrate REST endpoints",
                        "Refactored legacy codebase, improving loading performance of UI by 20%",
                        "Developed features using React and state management hooks"
                    ]
                }
            ],
            "education": [
                {"institution_or_degree": "Bachelor of Science in Computer Science, State University"}
            ],
            "projects": [
                {
                    "title": "Portfolio Dashboard",
                    "highlights": [
                        "Designed responsive interface with Tailwind CSS",
                        "Wrote automated tests to coverage level of 80%"
                    ]
                }
            ],
            "certifications": ["AWS Certified Developer Associate"]
        }
        
        resume = Resume(
            user_id=user.id,
            title="Full Stack Developer Master Resume",
            original_text="Demo Applicant\ndemo@resumeforge.ai | 123-456-7890\nSkills: React, TypeScript, Node.js, Python, SQL, Git, TailwindCSS\nExperience: Software Engineer at InnovateTech 2024 - Present\n- Collaborated with backend teams\n- Refactored legacy codebase\n- Developed features using React\nEducation: B.S. Computer Science",
            parsed_json=parsed_resume
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)
        
        # 3. Create Job Description
        job_parsed = {
            "title": "Senior Full Stack AI Engineer",
            "company": "Notion",
            "required_skills": ["React", "FastAPI", "Python", "Kubernetes", "AWS"],
            "preferred_skills": ["Docker", "PostgreSQL"],
            "responsibilities": ["Design and develop backend microservices", "Refactor dashboard interfaces", "Optimize search indexes"],
            "keywords": ["React", "FastAPI", "Python", "Kubernetes", "AWS"]
        }
        job = JobDescription(
            title="Senior Full Stack AI Engineer",
            company="Notion",
            description_text="We are looking for a Senior Full Stack AI Engineer to design backend systems in FastAPI/Python, manage deployment nodes on Kubernetes and AWS, and develop sleek React dashboards.",
            parsed_json=job_parsed
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        
        # 4. Create Tailored Resume
        tailored_resume = {
            "name": "Demo Applicant",
            "email": "demo@resumeforge.ai",
            "phone": "123-456-7890",
            "github": "https://github.com/demoapplicant",
            "linkedin": "https://linkedin.com/in/demoapplicant",
            "skills": ["React", "TypeScript", "Node.js", "Python", "SQL", "Git", "TailwindCSS", "PostgreSQL"],
            "experience": [
                {
                    "role": "Software Engineer",
                    "company": "InnovateTech",
                    "duration": "2024 - Present",
                    "highlights": [
                        "Collaborated with backend teams to integrate high-efficiency REST endpoints and APIs",
                        "Spearheaded legacy codebase refactoring, increasing UI page speed by 20% using React and Next.js optimization strategies",
                        "Engineered scalable core components using TypeScript and state management hooks"
                    ]
                }
            ],
            "education": [
                {"institution_or_degree": "Bachelor of Science in Computer Science, State University"}
            ],
            "projects": [
                {
                    "title": "Portfolio Dashboard",
                    "highlights": [
                        "Designed responsive interface with Tailwind CSS",
                        "Wrote automated tests to coverage level of 80%"
                    ]
                }
            ],
            "certifications": ["AWS Certified Developer Associate"]
        }
        
        fact_verification = {
            "verified_items": [
                { "item": "React", "category": "skills", "status": "VERIFIED", "explanation": "Matches original profile." },
                { "item": "Python", "category": "skills", "status": "VERIFIED", "explanation": "Found in experience description." }
            ],
            "similar_items": [
                { "item": "PostgreSQL", "category": "skills", "status": "SIMILAR", "explanation": "Mapped from 'SQL' in original skills list." }
            ],
            "unsupported_items": [
                { "item": "Kubernetes", "category": "skills", "status": "UNSUPPORTED", "explanation": "Docker & K8s are requested, but not listed on your resume. Recommend learning roadmap." },
                { "item": "AWS", "category": "skills", "status": "UNSUPPORTED", "explanation": "AWS Cloud deployment skills are requested but missing." }
            ]
        }
        
        ats_analysis = {
            "keyword_match": 85.0,
            "formatting": 95.0,
            "readability": 90.0,
            "impact_verbs": 88.0,
            "experience_alignment": 80.0,
            "detailed_feedback": "Excellent keyword density match. Action verbs added to Experience highlights. Educational criteria meets job constraints."
        }
        
        modifications = [
            {
                "original": "Refactored legacy codebase, improving loading performance of UI by 20%",
                "modified": "Spearheaded legacy codebase refactoring, increasing UI page speed by 20% using React and Next.js optimization strategies",
                "reason": "Replaced generic description with strong action verbs and target framework tags."
            }
        ]
        
        tailored = TailoredResume(
            resume_id=resume.id,
            job_id=job.id,
            tailored_text="Demo Applicant\ndemo@resumeforge.ai\nSkills: React, TypeScript, Node.js, Python, SQL, Git, TailwindCSS, PostgreSQL\nExperience: Software Engineer at InnovateTech 2024 - Present\n- Collaborated with backend teams to integrate high-efficiency REST endpoints and APIs\n- Spearheaded legacy codebase refactoring, increasing UI page speed by 20% using React\n- Engineered scalable core components using TypeScript",
            tailored_json=tailored_resume,
            status="COMPLETED",
            progress=100,
            ats_score=87.5,
            ats_analysis=ats_analysis,
            fact_verification=fact_verification,
            ai_metadata={"prompt_version": "2.1.0", "model_name": "gemini-1.5-flash (Seeded)"}
        )
        db.add(tailored)
        db.commit()
        db.refresh(tailored)
        
        # 5. Create Cover Letter
        cover_letter = CoverLetter(
            resume_id=resume.id,
            job_id=job.id,
            content="Dear Hiring Team at Notion,\n\nI am writing to express my enthusiastic interest in the Senior Full Stack AI Engineer position. With robust experiences in full-stack engineering, and my expertise in building high-fidelity interfaces, I am eager to contribute to Notion's design-centric goals.\n\nIn my previous roles, I successfully engineered optimized APIs and refactored core dashboard UI components. I look forward to discussing how my verified technical expertise aligns with your needs.\n\nBest regards,\nDemo Applicant",
            ai_metadata={"prompt_version": "2.1.0", "model_name": "gemini-1.5-flash (Seeded)"}
        )
        db.add(cover_letter)
        
        # 6. Create Interview Prep
        interview = InterviewPrep(
            tailored_resume_id=tailored.id,
            questions=[
                { "category": "Technical", "question": "How do you construct the ATS score components?", "answer": "Calculate category-level scores (Keywords, Format, Readability, Action verbs, and Experience alignment) with specific weights, summarizing gaps and optimization recommendations." },
                { "category": "Behavioral", "question": "Describe a project where you implemented a RAG pipeline.", "answer": "Chunked document text semantically, vector mapped them via scikit-learn metrics, and fetched relevant contexts before prompting the LLMs." }
            ]
        )
        db.add(interview)
        
        # 7. Create Skill Tracker Gaps
        skill_k8s = SkillTracker(
            user_id=user.id,
            skill_name="Kubernetes",
            category="technical",
            proficiency="beginner",
            roadmap={
                "skills_gap": ["Kubernetes"],
                "roadmap": [{
                    "skill": "Kubernetes",
                    "courses": ["Kubernetes for Developers (LFD259)", "Certified Kubernetes Application Developer (CKAD) Prep"],
                    "books": ["Kubernetes Up & Running", "Cloud Native DevOps with Kubernetes"],
                    "projects": ["Deploy a multi-tier guestbook app on a local minikube cluster", "Create helm charts for your FastAPI microservice"]
                }],
                "salary_estimate": "$120,000 - $145,000",
                "role_suitability": "Required for Notion role. Essential skill gap to acquire.",
                "next_steps": "Install minikube locally, deploy basic pods, and learn resource definitions."
            }
        )
        db.add(skill_k8s)
        
        # 8. Create Application Trackers
        app1 = ApplicationTracker(user_id=user.id, resume_id=resume.id, company="Vercel", role="Senior Frontend Engineer", status="wishlist", notes="Excited about dashboard architecture.")
        app2 = ApplicationTracker(user_id=user.id, resume_id=resume.id, company="Linear", role="Product Engineer", status="applied", notes="Tailored resume with linear design keywords.")
        app3 = ApplicationTracker(user_id=user.id, resume_id=resume.id, tailored_resume_id=tailored.id, company="Notion", role="Senior Full Stack AI Engineer", status="interview", notes="Prep coding questions and system design.")
        app4 = ApplicationTracker(user_id=user.id, resume_id=resume.id, company="Stripe", role="Staff Engineer", status="offer", notes="Offer letter received. Under review.")
        
        db.add_all([app1, app2, app3, app4])
        
        db.commit()
        logger.info("Demo database seeding complete!")
    except Exception as e:
        logger.error(f"Failed to seed demo database: {str(e)}")
        db.rollback()
    finally:
        db.close()
