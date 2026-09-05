import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.middleware import GlobalSecurityMiddleware

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Insert resource limits before CORS
app.add_middleware(GlobalSecurityMiddleware)

# Use explicit origins rather than wildcard with credentials
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root entrypoint linking to API documentation and system health."""
    return {
        "app": settings.PROJECT_NAME,
        "status": "online",
        "docs_url": "/docs",
        "openapi_url": f"{settings.API_V1_STR}/openapi.json",
        "health": "/health",
        "api_v1": settings.API_V1_STR,
    }

@app.get("/health")
async def root_health():
    """Basic root health check."""
    return {"status": "ok", "app": settings.PROJECT_NAME}

app.include_router(api_router, prefix=settings.API_V1_STR)
