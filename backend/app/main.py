from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import engine, Base
from app.core.logging import logger

# Import API Routers
from app.api.v1.auth import router as auth_router
from app.api.v1.resumes import router as resumes_router
from app.api.v1.tailor import router as tailor_router
from app.api.v1.applications import router as applications_router
from app.api.v1.cover_letter import router as cover_letter_router
from app.api.v1.interviews import router as interviews_router
from app.api.v1.skills import router as skills_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.health import router as health_router

# Initialize Database tables
from app.core.seed import seed_db
try:
    logger.info("Initializing database schemas...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database schemas initialized successfully.")
    seed_db()
except Exception as e:
    logger.error(f"Failed to initialize database tables: {str(e)}")

# Set up Rate Limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Apply Rate Limiting state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration
# Split comma-separated string to construct allowed origins list
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request log middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    import time
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    logger.info(f"Method: {request.method} Path: {request.url.path} Status: {response.status_code} Duration: {duration:.4f}s")
    return response

# Register API Routers
app.include_router(health_router, prefix=f"{settings.API_V1_STR}/health", tags=["Health"])
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(resumes_router, prefix=f"{settings.API_V1_STR}/resumes", tags=["Resumes"])
app.include_router(tailor_router, prefix=f"{settings.API_V1_STR}/tailor", tags=["Tailoring"])
app.include_router(applications_router, prefix=f"{settings.API_V1_STR}/applications", tags=["Applications"])
app.include_router(cover_letter_router, prefix=f"{settings.API_V1_STR}/cover-letter", tags=["Cover Letters"])
app.include_router(interviews_router, prefix=f"{settings.API_V1_STR}/interviews", tags=["Interviews"])
app.include_router(skills_router, prefix=f"{settings.API_V1_STR}/skills", tags=["Skills & Career Coaching"])
app.include_router(analytics_router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Dashboard Analytics"])

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} REST API. Visit /docs for Swagger documentation."}
