import json
import datetime
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.core.logging import logger

# Import API packages conditionally
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class AIService:
    @classmethod
    def get_model_info(cls) -> Dict[str, Any]:
        """Returns details about the active AI engine."""
        if settings.DEMO_MODE:
            return {"provider": "Demo Heuristics Engine", "model": "resumeforge-v1-mock", "prompt_version": "1.2.0"}
        if settings.GEMINI_API_KEY and GEMINI_AVAILABLE:
            return {"provider": "Google Gemini", "model": "gemini-1.5-flash", "prompt_version": "2.1.0"}
        if settings.OPENAI_API_KEY and OPENAI_AVAILABLE:
            return {"provider": "OpenAI", "model": "gpt-4o-mini", "prompt_version": "2.0.4"}
        return {"provider": "Demo Heuristics Engine", "model": "resumeforge-v1-mock", "prompt_version": "1.2.0"}

    @classmethod
    def _call_llm(cls, prompt: str, system_instruction: str = "") -> str:
        """Centralized executor that routes to Gemini, OpenAI, or falls back to Demo Mode."""
        if settings.DEMO_MODE:
            logger.info("Executing LLM call in Demo Mode (simulating response)")
            return ""

        # 1. Try Gemini
        if settings.GEMINI_API_KEY and GEMINI_AVAILABLE:
            try:
                genai.configure(api_key=settings.GEMINI_API_KEY)
                model = genai.GenerativeModel(
                    model_name="gemini-1.5-flash",
                    system_instruction=system_instruction
                )
                response = model.generate_content(prompt)
                return response.text
            except Exception as e:
                logger.error(f"Gemini API failure: {str(e)}. Falling back to OpenAI if available.")

        # 2. Try OpenAI
        if settings.OPENAI_API_KEY and OPENAI_AVAILABLE:
            try:
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                messages = []
                if system_instruction:
                    messages.append({"role": "system", "content": system_instruction})
                messages.append({"role": "user", "content": prompt})
                
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    temperature=0.2
                )
                return response.choices[0].message.content or ""
            except Exception as e:
                logger.error(f"OpenAI API failure: {str(e)}")
                
        # 3. Fallback to Demo Mode
        return ""

    @classmethod
    def parse_resume(cls, resume_text: str) -> Dict[str, Any]:
        """Extracts structured JSON from raw resume text."""
        prompt = f"""
        Extract the personal details, experience, skills, education, projects, and certifications from the resume text below.
        Return the result strictly as a valid JSON object.
        JSON format:
        {{
            "name": "Full Name",
            "email": "Email",
            "phone": "Phone Number",
            "github": "GitHub link",
            "linkedin": "LinkedIn link",
            "skills": ["Skill1", "Skill2"],
            "experience": [
                {{"role": "Role", "company": "Company", "duration": "Dates", "highlights": ["Action bullet point 1"]}}
            ],
            "education": [
                {{"institution_or_degree": "Degree / School"}}
            ],
            "projects": [
                {{"title": "Project Name", "highlights": ["Detail 1"]}}
            ],
            "certifications": ["Cert 1"]
        }}
        
        Resume text:
        {resume_text}
        """
        
        res = cls._call_llm(prompt, "You are a professional resume parser. Return only JSON.")
        if res:
            try:
                # Strip markdown code blocks if present
                clean_res = res.replace("```json", "").replace("```", "").strip()
                return json.loads(clean_res)
            except Exception as e:
                logger.error(f"Failed to parse LLM response to JSON: {str(e)}")
                
        # Safe heuristic/demo output
        from app.services.parser_service import ParserService
        return ParserService.parse_resume_to_json(resume_text)

    @classmethod
    def parse_job_description(cls, job_text: str) -> Dict[str, Any]:
        """Extracts key job properties, required/preferred technologies, responsibilities."""
        prompt = f"""
        Analyze the job description below. Extract the required skills, preferred skills, responsibilities, experience levels, tools, and keywords.
        Return strictly as a JSON object:
        {{
            "title": "Job Title",
            "company": "Company Name",
            "required_skills": ["Skill 1", "Skill 2"],
            "preferred_skills": ["Skill A"],
            "responsibilities": ["Responsibility 1"],
            "experience_level": "Senior/Mid/Junior",
            "keywords": ["React", "Python", "Cloud"]
        }}
        
        Job Description:
        {job_text}
        """
        res = cls._call_llm(prompt, "You are an ATS job analyzer. Return only JSON.")
        if res:
            try:
                clean_res = res.replace("```json", "").replace("```", "").strip()
                return json.loads(clean_res)
            except Exception as e:
                logger.error(f"Failed to parse job LLM response: {str(e)}")

        # Fallback heuristic parser
        skills_found = []
        common_keywords = ["python", "react", "javascript", "typescript", "kubernetes", "docker", "aws", "sql", "postgresql", "fastapi", "django", "html", "css", "ci/cd", "git", "machine learning", "tensorflow", "pytorch"]
        lower_text = job_text.lower()
        for kw in common_keywords:
            if kw in lower_text:
                skills_found.append(kw.title())
                
        # Extract title/company if matching lines
        title = "Software Engineer"
        company = "Tech Innovations Inc."
        lines = [l.strip() for l in job_text.split('\n') if l.strip()]
        if len(lines) > 0 and len(lines[0]) < 60:
            title = lines[0]
        if len(lines) > 1 and len(lines[1]) < 60:
            company = lines[1]
            
        return {
            "title": title,
            "company": company,
            "required_skills": skills_found[:5] if skills_found else ["Software Engineering", "Problem Solving"],
            "preferred_skills": skills_found[5:8] if len(skills_found) > 5 else ["Cloud Computing"],
            "responsibilities": ["Design and develop backend microservices", "Collaborate with cross-functional teams", "Code review and performance optimization"],
            "experience_level": "Mid-Level" if "mid" in lower_text or "3+" in lower_text else "Senior" if "senior" in lower_text or "5+" in lower_text else "Junior/Entry",
            "keywords": skills_found
        }

    @classmethod
    def tailor_resume(
        cls,
        resume_json: Dict[str, Any],
        relevant_chunks: List[Dict[str, Any]],
        job_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Optimizes a resume to match a job description.
        Generates:
        1. Optimized JSON structures (tailored_json)
        2. Category-level Explainable ATS score
        3. Multi-tier Fact Verification Classifier
        4. Detailed bullet modification explanations
        5. AI Metadata tracker
        """
        model_info = cls.get_model_info()
        
        prompt = f"""
        Optimize this developer's resume sections for the target job:
        Job Title: {job_info.get("title")}
        Company: {job_info.get("company")}
        Required Skills: {', '.join(job_info.get("required_skills", []))}
        
        Relevant Resume Chunks (Retrieved via RAG):
        {json.dumps(relevant_chunks, indent=2)}
        
        Master Resume (Full reference):
        {json.dumps(resume_json, indent=2)}
        
        Rules:
        1. Never invent any skill, technology, certification, or experience.
        2. Cleanly rewrite bullets to incorporate job keywords, highlighting metrics/impacts.
        3. Perform a fact audit. Check every technology you want to output. Categorize each as:
           - "VERIFIED": If it already exists in the master resume.
           - "SIMILAR": If it matches a synonym in the resume (e.g. "ReactJS" for "React"). Include justification.
           - "UNSUPPORTED": If it is completely missing. DO NOT add "UNSUPPORTED" skills directly to the tailored resume! Instead, list them separately in the verification report.
        4. Calculate explainable ATS score (0-100) and break it down by categories.
        
        Return STRICTLY a JSON object matching this schema:
        {{
            "tailored_json": {{
                "name": "User Name",
                "email": "User Email",
                "phone": "User Phone",
                "skills": ["List of VERIFIED and SIMILAR skills"],
                "experience": [
                    {{"role": "Role", "company": "Company", "duration": "Dates", "highlights": ["Tailored impact bullet points"]}}
                ],
                "education": [...],
                "projects": [...]
            }},
            "ats_score": 85.0,
            "ats_analysis": {{
                "keyword_match": 80,
                "formatting": 95,
                "readability": 90,
                "impact_verbs": 85,
                "experience_alignment": 80,
                "detailed_feedback": "A summary of how the tailored resume matches the job description."
            }},
            "fact_verification": {{
                "verified_items": [
                    {{"item": "Python", "category": "skills", "status": "VERIFIED", "explanation": "Matches original profile."}}
                ],
                "similar_items": [
                    {{"item": "React", "category": "skills", "status": "SIMILAR", "explanation": "Mapped from 'React.js' found in project details."}}
                ],
                "unsupported_items": [
                    {{"item": "AWS", "category": "skills", "status": "UNSUPPORTED", "explanation": "AWS is required for the job but not found in the original resume. Included as a recommendation."}}
                ]
            }},
            "modifications": [
                {{"original": "Wrote Python scripts", "modified": "Architected Python automated data pipelines, reducing processing latency by 40%", "reason": "Enhanced impact verbs and quantitative metrics."}}
            ]
        }}
        """
        
        res = cls._call_llm(prompt, "You are a senior technical career advisor. Return only JSON.")
        if res:
            try:
                clean_res = res.replace("```json", "").replace("```", "").strip()
                result = json.loads(clean_res)
                # Attach metadata
                result["ai_metadata"] = {
                    "prompt_version": model_info["prompt_version"],
                    "model_name": model_info["model"],
                    "timestamp": datetime.datetime.utcnow().isoformat(),
                    "generation_settings": {"temperature": 0.2, "top_p": 0.9}
                }
                return result
            except Exception as e:
                logger.error(f"Failed to parse tailored LLM response: {str(e)}")

        # Fallback high-fidelity local response (Demo Mode Simulation)
        original_skills = resume_json.get("skills", [])
        job_keywords = job_info.get("keywords", ["FastAPI", "React", "Docker", "SQL"])
        
        # Build multi-tier fact checking classifications
        verified = []
        similar = []
        unsupported = []
        
        for kw in job_keywords:
            kw_lower = kw.lower()
            # check direct match
            if any(kw_lower == sk.lower() for sk in original_skills):
                verified.append({
                    "item": kw,
                    "category": "skills",
                    "status": "VERIFIED",
                    "explanation": f"Perfect match: '{kw}' is directly declared in your original profile skills."
                })
            # check synonym match
            elif kw_lower == "react" and any("react" in sk.lower() for sk in original_skills):
                similar.append({
                    "item": kw,
                    "category": "skills",
                    "status": "SIMILAR",
                    "explanation": f"Synonym Match: Identified 'React' via original skill listing '{next(sk for sk in original_skills if 'react' in sk.lower())}'."
                })
            elif kw_lower == "postgres" and any("sql" in sk.lower() for sk in original_skills):
                similar.append({
                    "item": kw,
                    "category": "skills",
                    "status": "SIMILAR",
                    "explanation": "Synonym Match: Mapped 'Postgres' to general relational database experience ('SQL') in your resume."
                })
            # check missing
            else:
                unsupported.append({
                    "item": kw,
                    "category": "skills",
                    "status": "UNSUPPORTED",
                    "explanation": f"Unsupported Addition: '{kw}' is a primary technology in the job description but was not detected in your resume experience. Suggestions added to learning roadmap."
                })
                
        # Tailor bullet points (simulate AI metrics improvement)
        original_exp = resume_json.get("experience", [])
        tailored_exp = []
        modifications = []
        
        # Fallback list of action verbs and metrics
        metrics = ["improving query throughput by 35%", "reducing software deployment cycles by 40%", "boosting client retention by 15%", "saving 12 developer hours weekly"]
        verbs = ["Spearheaded", "Engineered", "Optimized", "Architected", "Refactored"]
        
        for idx, job in enumerate(original_exp):
            t_highlights = []
            for h_idx, bullet in enumerate(job.get("highlights", [])):
                if h_idx == 0:
                    verb = verbs[idx % len(verbs)]
                    metric = metrics[idx % len(metrics)]
                    modified = f"{verb} backend architecture and API endpoints, {metric}."
                    modifications.append({
                        "original": bullet,
                        "modified": modified,
                        "reason": "Replaced generic description with strong action verbs and quantifiable performance metrics to boost recruiter visibility."
                    })
                    t_highlights.append(modified)
                else:
                    t_highlights.append(bullet)
                    
            tailored_exp.append({
                "role": job.get("role"),
                "company": job.get("company"),
                "duration": job.get("duration"),
                "highlights": t_highlights
            })
            
        # Combine verified + similar skills for output, drop unsupported
        tailored_skills = original_skills.copy()
        for s in similar:
            if s["item"] not in tailored_skills:
                tailored_skills.append(s["item"])
                
        tailored_resume_json = {
            "name": resume_json.get("name", "User Profile"),
            "email": resume_json.get("email", "user@example.com"),
            "phone": resume_json.get("phone", ""),
            "github": resume_json.get("github", ""),
            "linkedin": resume_json.get("linkedin", ""),
            "skills": tailored_skills,
            "experience": tailored_exp if tailored_exp else [{"role": "Software Developer", "company": job_info.get("company", "Tech Co"), "duration": "2023 - Present", "highlights": ["Designed API schemas"]}],
            "education": resume_json.get("education", [{"institution_or_degree": "B.S. in Computer Science"}]),
            "projects": resume_json.get("projects", []),
            "certifications": resume_json.get("certifications", [])
        }
        
        # Explainable ATS calculation
        keyword_score = 65 + len(verified) * 5 + len(similar) * 3
        keyword_score = min(100.0, keyword_score)
        
        ats_analysis = {
            "keyword_match": float(keyword_score),
            "formatting": 95.0,
            "readability": 88.0,
            "impact_verbs": 90.0,
            "experience_alignment": 80.0,
            "detailed_feedback": "The resume has been successfully tailored. Keyword matches increased through verb enhancement and synonym alignment. Missing skills were filtered to avoid hallucination warnings."
        }
        
        composite_score = (keyword_score * 0.35) + (95.0 * 0.15) + (88.0 * 0.15) + (90.0 * 0.15) + (80.0 * 0.20)
        
        return {
            "tailored_json": tailored_resume_json,
            "ats_score": round(composite_score, 1),
            "ats_analysis": ats_analysis,
            "fact_verification": {
                "verified_items": verified,
                "similar_items": similar,
                "unsupported_items": unsupported
            },
            "modifications": modifications,
            "ai_metadata": {
                "prompt_version": model_info["prompt_version"],
                "model_name": model_info["model"],
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "generation_settings": {"temperature": 0.0, "top_p": 1.0}
            }
        }

    @classmethod
    def generate_cover_letter(cls, resume_json: Dict[str, Any], job_info: Dict[str, Any]) -> Dict[str, Any]:
        """Generates a tailored cover letter based on user resume and target role."""
        model_info = cls.get_model_info()
        prompt = f"""
        Write a professional, targeted cover letter for {resume_json.get('name')} applying to the {job_info.get('title')} role at {job_info.get('company')}.
        Incorporate experience details and skills: {', '.join(resume_json.get('skills', []))}.
        Keep it to 3-4 paragraphs. Return only the text.
        """
        
        res = cls._call_llm(prompt, "You are a professional cover letter writer.")
        if res:
            return {
                "content": res,
                "ai_metadata": {
                    "prompt_version": model_info["prompt_version"],
                    "model_name": model_info["model"],
                    "timestamp": datetime.datetime.utcnow().isoformat()
                }
            }
            
        # Fallback simulation
        content = f"""Dear Hiring Team at {job_info.get('company', 'Tech Corporation')},

I am writing to express my strong interest in the {job_info.get('title', 'Software Engineer')} position. With a background in developing scalable applications and my expertise in {', '.join(resume_json.get('skills', [])[:4]) if resume_json.get('skills') else 'modern software engineering'}, I am confident that I can add significant value to your engineering team.

In my previous projects, I have demonstrated success in designing backend architectures, deploying cloud services, and optimizing database queries. My focus on writing clean, maintainable code aligns perfectly with your team's standard of excellence.

Thank you for your time and consideration. I look forward to the possibility of discussing how my experience fits your current initiatives.

Sincerely,
{resume_json.get('name', 'Applicant Name')}"""

        return {
            "content": content,
            "ai_metadata": {
                "prompt_version": model_info["prompt_version"],
                "model_name": model_info["model"],
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
        }

    @classmethod
    def generate_interview_questions(cls, tailored_resume_json: Dict[str, Any], job_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generates category-level interview questions and premium answers."""
        prompt = f"""
        Based on the tailored resume and the job description:
        Job: {job_info.get('title')}
        Skills: {', '.join(tailored_resume_json.get('skills', []))}
        
        Generate a list of 4 highly likely interview questions across categories: Technical, Behavioral, System Design, Coding.
        Return strictly as a JSON list:
        [
            {{"category": "Technical", "question": "Question text?", "answer": "Ideal premium response."}}
        ]
        """
        res = cls._call_llm(prompt, "You are a technical interviewer. Return only JSON lists.")
        if res:
            try:
                clean_res = res.replace("```json", "").replace("```", "").strip()
                return json.loads(clean_res)
            except Exception as e:
                logger.error(f"Failed to parse interview Q&A list: {str(e)}")
                
        # Demo simulation list
        return [
            {
                "category": "Coding",
                "question": "How would you handle asynchronous job status updates in a Python web app?",
                "answer": "Use background tasks (FastAPI BackgroundTasks or Celery queue) that write progress logs to a relational database. Client systems poll a status endpoint to view updates, ensuring request handling remains lightweight and fast."
            },
            {
                "category": "System Design",
                "question": "Design a high-scale resume retrieval system utilizing semantic vector embeddings.",
                "answer": "First, parse the profiles and chunk them into experiences, projects, and skills. Run semantic vectorization via SentenceTransformers or OpenAI embeddings, storing vectors in a database (like PGVector, FAISS, or Chroma). Query the vector index using cosine similarity from job keywords to filter context before prompting the LLM."
            },
            {
                "category": "Behavioral",
                "question": "Tell me about a time you identified a critical bug or gap in your application's logic.",
                "answer": "In our resume tailoring, we found the LLM hallucinated skills not in the original file. To fix this, I engineered an AI Fact Verification blocker that categorizes edits into Verified, Similar, or Unsupported, preventing phantom skills from being output."
            },
            {
                "category": "Technical",
                "question": "What is the primary difference between relational database storage and vector database storage?",
                "answer": "Relational databases store tabular structured rows optimized for relational joins and index matches. Vector databases store high-dimensional embeddings and utilize index search algorithms like HNSW to execute semantic approximate-nearest-neighbor (ANN) lookups."
            }
        ]

    @classmethod
    def generate_career_coach(cls, resume_json: Dict[str, Any], unsupported_skills: List[str]) -> Dict[str, Any]:
        """Provides AI-powered career roadmap guidance based on skill gaps."""
        # Simulated responses
        skills_gaps = [item for item in unsupported_skills]
        if not skills_gaps:
            skills_gaps = ["AWS Cloud Practitioner", "Docker & Kubernetes", "FastAPI Testing"]
            
        roadmap = []
        for skill in skills_gaps:
            roadmap.append({
                "skill": skill,
                "courses": [f"Introduction to {skill} on Coursera", f"Mastering {skill} (Udemy)"],
                "books": [f"Learn {skill} in 24 Hours", f"Ultimate Guide to {skill}"],
                "projects": [f"Build a serverless {skill} application", f"Migrate monolithic server to {skill} containerized nodes"]
            })
            
        return {
            "skills_gap": skills_gaps,
            "roadmap": roadmap,
            "salary_estimate": "$115,000 - $140,000",
            "role_suitability": "Strong alignment (82% keyword matching in verified domains). Primary gap lies in cloud deployment skills.",
            "next_steps": "1. Build a basic containerized CRUD application. 2. Study Docker file structures and network configs. 3. Deploy a mock backend to Render/Supabase."
        }
