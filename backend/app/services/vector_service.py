from typing import Dict, Any, List
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.core.logging import logger

class VectorService:
    @staticmethod
    def chunk_resume(resume_json: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Splits a structured resume JSON into semantic chunks for vector indexing.
        Each chunk represents a job, a project, education, or skills.
        """
        chunks = []
        chunk_id = 0
        
        # 1. Experience chunks
        for job in resume_json.get("experience", []):
            role = job.get("role", "")
            company = job.get("company", "")
            highlights = "\n".join(job.get("highlights", []))
            text = f"Experience: {role} at {company}.\nResponsibilities & Achievements:\n{highlights}"
            chunks.append({
                "id": chunk_id,
                "text": text,
                "metadata": {"type": "experience", "role": role, "company": company}
            })
            chunk_id += 1
            
        # 2. Projects chunks
        for proj in resume_json.get("projects", []):
            title = proj.get("title", "")
            highlights = "\n".join(proj.get("highlights", []))
            text = f"Project: {title}.\nDetails:\n{highlights}"
            chunks.append({
                "id": chunk_id,
                "text": text,
                "metadata": {"type": "project", "title": title}
            })
            chunk_id += 1
            
        # 3. Skills chunk
        skills = resume_json.get("skills", [])
        if skills:
            skills_str = ", ".join(skills)
            text = f"Technical Skills and Tools:\n{skills_str}"
            chunks.append({
                "id": chunk_id,
                "text": text,
                "metadata": {"type": "skills"}
            })
            chunk_id += 1
            
        # 4. Education chunk
        for edu in resume_json.get("education", []):
            institution = edu.get("institution_or_degree", "")
            text = f"Education & Academics:\n{institution}"
            chunks.append({
                "id": chunk_id,
                "text": text,
                "metadata": {"type": "education"}
            })
            chunk_id += 1

        # 5. Certifications chunk
        certs = resume_json.get("certifications", [])
        if certs:
            certs_str = ", ".join(certs)
            text = f"Certifications & Courses:\n{certs_str}"
            chunks.append({
                "id": chunk_id,
                "text": text,
                "metadata": {"type": "certifications"}
            })
            chunk_id += 1
            
        return chunks

    @staticmethod
    def retrieve_relevant_chunks(chunks: List[Dict[str, Any]], query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Uses scikit-learn TF-IDF and Cosine Similarity to find relevant chunks.
        Falls back safely if no chunks exist.
        """
        if not chunks:
            return []
            
        try:
            texts = [chunk["text"] for chunk in chunks]
            
            # Initialize TF-IDF Vectorizer
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform(texts)
            query_vector = vectorizer.transform([query])
            
            # Compute similarity
            similarities = cosine_similarity(query_vector, tfidf_matrix).flatten()
            
            # Get top K indices
            top_indices = np.argsort(similarities)[::-1][:top_k]
            
            results = []
            for idx in top_indices:
                # Include similarity score in response
                chunk = chunks[idx].copy()
                chunk["score"] = float(similarities[idx])
                results.append(chunk)
                
            return results
        except Exception as e:
            logger.error(f"Error in vector retrieval: {str(e)}")
            # Fallback: return first top_k chunks
            return chunks[:top_k]
