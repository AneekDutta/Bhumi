from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

router = APIRouter()

@router.get("/health", response_model=dict)
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Detailed health check for API v1.
    Tests database connectivity.
    """
    db_status = "ok"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {e!s}"

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "services": {
            "database": db_status
        },
        "version": "1.0.0"
    }
