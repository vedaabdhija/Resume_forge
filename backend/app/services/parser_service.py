import re
import fitz  # PyMuPDF
from docx import Document
from io import BytesIO
from typing import Dict, Any, List

class ParserService:
    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> str:
        text = ""
        try:
            pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
            for page in pdf_document:
                text += page.get_text()
            pdf_document.close()
        except Exception as e:
            text = f"Error extracting PDF: {str(e)}"
        return text

    @staticmethod
    def extract_text_from_docx(file_bytes: bytes) -> str:
        text = ""
        try:
            doc = Document(BytesIO(file_bytes))
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
        except Exception as e:
            text = f"Error extracting DOCX: {str(e)}"
        return text

    @classmethod
    def parse_resume_to_json(cls, text: str) -> Dict[str, Any]:
        """
        Parses raw resume text using heuristics and patterns.
        Extremely robust fallback parsing for Demo Mode.
        """
        email = cls._extract_email(text)
        phone = cls._extract_phone(text)
        github = cls._extract_github(text)
        linkedin = cls._extract_linkedin(text)
        name = cls._extract_name(text)
        
        # Segment sections
        sections = cls._segment_sections(text)
        
        return {
            "name": name,
            "email": email,
            "phone": phone,
            "github": github,
            "linkedin": linkedin,
            "skills": sections.get("skills", []),
            "experience": sections.get("experience", []),
            "education": sections.get("education", []),
            "projects": sections.get("projects", []),
            "certifications": sections.get("certifications", [])
        }

    @staticmethod
    def _extract_email(text: str) -> str:
        match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        return match.group(0) if match else ""

    @staticmethod
    def _extract_phone(text: str) -> str:
        match = re.search(r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
        return match.group(0) if match else ""

    @staticmethod
    def _extract_github(text: str) -> str:
        match = re.search(r'github\.com/[\w\.-]+', text, re.IGNORECASE)
        return f"https://{match.group(0)}" if match else ""

    @staticmethod
    def _extract_linkedin(text: str) -> str:
        match = re.search(r'linkedin\.com/in/[\w\.-]+', text, re.IGNORECASE)
        return f"https://{match.group(0)}" if match else ""

    @staticmethod
    def _extract_name(text: str) -> str:
        # Check first line(s) for a name
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        if lines:
            # Clean common headers
            first_line = lines[0]
            if len(first_line.split()) <= 4 and not any(kw in first_line.lower() for kw in ["resume", "cv", "portfolio", "email", "phone"]):
                return first_line
        return "Applicant Name"

    @classmethod
    def _segment_sections(cls, text: str) -> Dict[str, List[Any]]:
        lines = text.split('\n')
        current_section = None
        
        sections = {
            "skills": [],
            "experience": [],
            "education": [],
            "projects": [],
            "certifications": []
        }
        
        experience_headers = {"experience", "work history", "employment", "professional history"}
        skills_headers = {"skills", "technical skills", "skills & tools", "core competencies"}
        education_headers = {"education", "academic qualification", "academic background"}
        project_headers = {"projects", "academic projects", "key projects"}
        cert_headers = {"certifications", "licenses", "courses", "certificates"}
        
        current_block = []
        
        for line in lines:
            cleaned = line.strip()
            if not cleaned:
                continue
                
            lower_line = cleaned.lower().replace(":", "")
            
            # Identify section transitions
            if any(h == lower_line or lower_line.startswith(h + " ") for h in experience_headers):
                cls._save_current_section(sections, current_section, current_block)
                current_section = "experience"
                current_block = []
            elif any(h == lower_line or lower_line.startswith(h + " ") for h in skills_headers):
                cls._save_current_section(sections, current_section, current_block)
                current_section = "skills"
                current_block = []
            elif any(h == lower_line or lower_line.startswith(h + " ") for h in education_headers):
                cls._save_current_section(sections, current_section, current_block)
                current_section = "education"
                current_block = []
            elif any(h == lower_line or lower_line.startswith(h + " ") for h in project_headers):
                cls._save_current_section(sections, current_section, current_block)
                current_section = "projects"
                current_block = []
            elif any(h == lower_line or lower_line.startswith(h + " ") for h in cert_headers):
                cls._save_current_section(sections, current_section, current_block)
                current_section = "certifications"
                current_block = []
            else:
                if current_section:
                    current_block.append(cleaned)
                    
        cls._save_current_section(sections, current_section, current_block)
        return sections

    @staticmethod
    def _save_current_section(sections: dict, current_section: str, block: List[str]):
        if not current_section or not block:
            return
            
        if current_section == "skills":
            # Split comma separated skills
            skills_list = []
            for line in block:
                # remove labels like "Languages:"
                cleaned_line = re.sub(r'^[^:]+:\s*', '', line)
                items = [item.strip() for item in re.split(r'[,|•·\t]', cleaned_line) if item.strip()]
                skills_list.extend(items)
            sections["skills"] = list(set(skills_list))
            
        elif current_section == "experience":
            # Simple experiences parsing: grouping bullet points
            jobs = []
            current_job = {"role": "", "company": "", "duration": "", "highlights": []}
            for line in block:
                if line.startswith("-") or line.startswith("•") or line.startswith("*"):
                    current_job["highlights"].append(line.lstrip("-•* ").strip())
                else:
                    if current_job["role"] or current_job["highlights"]:
                        jobs.append(current_job)
                        current_job = {"role": "", "company": "", "duration": "", "highlights": []}
                    # Heuristic for Job title and Company (e.g. Software Engineer at Google)
                    if " at " in line:
                        parts = line.split(" at ")
                        current_job["role"] = parts[0].strip()
                        current_job["company"] = parts[1].strip()
                    else:
                        current_job["role"] = line
            if current_job["role"] or current_job["highlights"]:
                jobs.append(current_job)
            sections["experience"] = jobs
            
        elif current_section == "education":
            edu = []
            for line in block:
                edu.append({"institution_or_degree": line})
            sections["education"] = edu
            
        elif current_section == "projects":
            proj = []
            current_proj = {"title": "", "highlights": []}
            for line in block:
                if line.startswith("-") or line.startswith("•") or line.startswith("*"):
                    current_proj["highlights"].append(line.lstrip("-•* ").strip())
                else:
                    if current_proj["title"] or current_proj["highlights"]:
                        proj.append(current_proj)
                        current_proj = {"title": "", "highlights": []}
                    current_proj["title"] = line
            if current_proj["title"] or current_proj["highlights"]:
                proj.append(current_proj)
            sections["projects"] = proj
            
        elif current_section == "certifications":
            sections["certifications"] = [line for line in block if len(line) > 3]
