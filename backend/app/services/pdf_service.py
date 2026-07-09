from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
from typing import Dict, Any

class PDFService:
    @staticmethod
    def generate_resume_pdf(resume_json: Dict[str, Any], template_name: str = "professional") -> bytes:
        """
        Generates an ATS-compliant PDF resume from structured JSON data.
        Templates supported: professional, tech, minimal.
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=45,
            leftMargin=45,
            topMargin=45,
            bottomMargin=45
        )
        
        story = []
        styles = getSampleStyleSheet()
        
        # Define color schemes based on template
        primary_color = colors.HexColor("#1A202C")  # Dark Slate
        accent_color = colors.HexColor("#2B6CB0")   # Slate Blue
        
        if template_name == "tech":
            primary_color = colors.HexColor("#1A365D")  # Navy Blue
            accent_color = colors.HexColor("#319795")   # Teal
        elif template_name == "minimal":
            primary_color = colors.HexColor("#2D3748")  # Charcoal
            accent_color = colors.HexColor("#4A5568")   # Medium Slate
            
        # Custom styles
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=22,
            leading=26,
            textColor=primary_color,
            alignment=TA_CENTER
        )
        
        contact_style = ParagraphStyle(
            'ContactInfo',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#4A5568"),
            alignment=TA_CENTER
        )
        
        section_heading_style = ParagraphStyle(
            'SectionHeading',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=accent_color,
            spaceBefore=12,
            spaceAfter=4,
            keepWithNext=True
        )
        
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#2D3748")
        )
        
        bold_body_style = ParagraphStyle(
            'BoldBody',
            parent=body_style,
            fontName='Helvetica-Bold'
        )
        
        bullet_style = ParagraphStyle(
            'BulletText',
            parent=body_style,
            leftIndent=15,
            firstLineIndent=-10,
            spaceAfter=3
        )
        
        # 1. Header (Name + Contact details)
        name = resume_json.get("name", "Applicant Name")
        story.append(Paragraph(name, title_style))
        story.append(Spacer(1, 4))
        
        contact_parts = []
        if resume_json.get("email"):
            contact_parts.append(resume_json["email"])
        if resume_json.get("phone"):
            contact_parts.append(resume_json["phone"])
        if resume_json.get("linkedin"):
            linkedin_clean = resume_json["linkedin"].replace("https://", "").replace("www.", "")
            contact_parts.append(f"<a href='{resume_json['linkedin']}' color='blue'>{linkedin_clean}</a>")
        if resume_json.get("github"):
            github_clean = resume_json["github"].replace("https://", "").replace("www.", "")
            contact_parts.append(f"<a href='{resume_json['github']}' color='blue'>{github_clean}</a>")
            
        contact_str = "  |  ".join(contact_parts)
        story.append(Paragraph(contact_str, contact_style))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1, color=accent_color, spaceBefore=1, spaceAfter=8))
        
        # 2. Skills Section
        skills = resume_json.get("skills", [])
        if skills:
            story.append(Paragraph("TECHNICAL SKILLS", section_heading_style))
            skills_str = ", ".join(skills)
            story.append(Paragraph(skills_str, body_style))
            story.append(Spacer(1, 8))
            
        # 3. Professional Experience Section
        experience = resume_json.get("experience", [])
        if experience:
            story.append(Paragraph("PROFESSIONAL EXPERIENCE", section_heading_style))
            for job in experience:
                role = job.get("role", "")
                company = job.get("company", "")
                duration = job.get("duration", "")
                
                # Single-line layout for title/company/duration
                meta_table_data = [
                    [
                        Paragraph(f"<b>{role}</b>", body_style),
                        Paragraph(f"<b>{company}</b>", body_style),
                        Paragraph(duration, ParagraphStyle('RightText', parent=body_style, alignment=TA_RIGHT))
                    ]
                ]
                meta_table = Table(meta_table_data, colWidths=[200, 180, 120])
                meta_table.setStyle(TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('LEFTPADDING', (0,0), (-1,-1), 0),
                    ('RIGHTPADDING', (0,0), (-1,-1), 0),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                    ('TOPPADDING', (0,0), (-1,-1), 2),
                ]))
                story.append(meta_table)
                
                # Bullet points
                for highlight in job.get("highlights", []):
                    story.append(Paragraph(f"&bull; {highlight}", bullet_style))
                story.append(Spacer(1, 6))
            story.append(Spacer(1, 4))
            
        # 4. Projects Section
        projects = resume_json.get("projects", [])
        if projects:
            story.append(Paragraph("PROJECTS", section_heading_style))
            for proj in projects:
                title = proj.get("title", "")
                
                story.append(Paragraph(f"<b>{title}</b>", body_style))
                for highlight in proj.get("highlights", []):
                    story.append(Paragraph(f"&bull; {highlight}", bullet_style))
                story.append(Spacer(1, 4))
            story.append(Spacer(1, 4))
            
        # 5. Education Section
        education = resume_json.get("education", [])
        if education:
            story.append(Paragraph("EDUCATION", section_heading_style))
            for edu in education:
                degree = edu.get("institution_or_degree", "")
                story.append(Paragraph(degree, body_style))
                story.append(Spacer(1, 4))
                
        # 6. Certifications Section
        certs = resume_json.get("certifications", [])
        if certs:
            story.append(Paragraph("CERTIFICATIONS", section_heading_style))
            certs_str = ", ".join(certs)
            story.append(Paragraph(certs_str, body_style))
            
        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
