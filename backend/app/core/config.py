import os
from pathlib import Path

from dotenv import load_dotenv

# Try finding .env in current dir, parent dir, or repo root
for p in [Path(".env"), Path("../.env"), Path(__file__).resolve().parents[2] / ".env"]:
    if p.exists():
        load_dotenv(p)
        break
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "SIH26016 Land Acquisition"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/sih26016")

    # Environment & Security
    ENV: str = os.getenv("ENV", "development") # development, test, production
    AUTH_MODE: str = os.getenv("AUTH_MODE", "mock") # mock, prod

    # Supabase Storage
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    STORAGE_BUCKET_NAME: str = os.getenv("STORAGE_BUCKET_NAME", "documents")

    # CORS
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")

    # Limits
    MAX_REQUEST_BODY_SIZE: int = int(os.getenv("MAX_REQUEST_BODY_SIZE", str(2 * 1024 * 1024))) # 2MB

    # Rate Limits (Requests per minute)
    RL_READ: int = int(os.getenv("RL_READ", "120"))
    RL_MUTATION: int = int(os.getenv("RL_MUTATION", "30"))
    RL_COMPUTE: int = int(os.getenv("RL_COMPUTE", "20"))
    RL_SIMULATION: int = int(os.getenv("RL_SIMULATION", "10"))
    RL_EXPORT: int = int(os.getenv("RL_EXPORT", "5"))
    RL_AUTH: int = int(os.getenv("RL_AUTH", "5"))

settings = Settings()

# Fail closed if production is misconfigured
if settings.ENV == "production" and settings.AUTH_MODE == "mock":
        raise RuntimeError("CRITICAL: Cannot run production environment with mock authentication enabled.")
