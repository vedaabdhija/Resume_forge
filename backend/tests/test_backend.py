import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.services.parser_service import ParserService
from app.services.vector_service import VectorService
from app.services.ai_service import AIService

client = TestClient(app)

# 1. Security Tests
def test_password_hashing():
    password = "secretpassword"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

def test_jwt_issuance():
    user_id = 42
    token = create_access_token(subject=user_id)
    assert token is not None
    decoded = decode_access_token(token)
    assert decoded == str(user_id)

# 2. Heuristics Parser Tests
def test_email_and_phone_extraction():
    text = "John Doe\nEmail: developer@example.com\nPhone: (123) 456-7890\nGitHub: github.com/johndoe"
    parsed = ParserService.parse_resume_to_json(text)
    assert parsed["email"] == "developer@example.com"
    assert parsed["phone"] == "(123) 456-7890"
    assert parsed["github"] == "https://github.com/johndoe"

# 3. RAG Retrieval Vector Service Tests
def test_vector_chunk_retrieval():
    resume_data = {
        "skills": ["Python", "FastAPI"],
        "experience": [
            {
                "role": "Data Engineer",
                "company": "Innovate",
                "highlights": ["Built Python pipeline architecture on Kubernetes"]
            }
        ]
    }
    chunks = VectorService.chunk_resume(resume_data)
    assert len(chunks) == 2 # 1 experience, 1 skills
    
    # Query for Python pipeline
    results = VectorService.retrieve_relevant_chunks(chunks, "Python pipeline details", top_k=1)
    assert len(results) == 1
    assert "Experience: Data Engineer" in results[0]["text"]

# 4. Fact Verification Classifier Tests
def test_fact_verification_classification():
    resume_data = {
        "skills": ["ReactJS", "Python"]
    }
    job_info = {
        "title": "Software Engineer",
        "company": "Notion",
        "keywords": ["React", "AWS"]
    }
    
    # Run optimization simulation
    optimized = AIService.tailor_resume(resume_data, [], job_info)
    fact_check = optimized["fact_verification"]
    
    # ReactJS is similar to React -> should classify as SIMILAR
    similar_names = [item["item"] for item in fact_check["similar_items"]]
    assert "React" in similar_names
    
    # AWS is missing -> should classify as UNSUPPORTED
    unsupported_names = [item["item"] for item in fact_check["unsupported_items"]]
    assert "AWS" in unsupported_names
    
    # Ensure unsupported items are excluded from tailored skills lists to prevent hallucinating skills
    assert "AWS" not in optimized["tailored_json"]["skills"]

# 5. Integration Router Health Check Test
def test_health_endpoint():
    response = client.get("/api/v1/health/")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "online"
    assert "database" in json_data
