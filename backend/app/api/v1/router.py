from fastapi import APIRouter

from app.api.v1 import (
    cases,
    dashboard,
    documents,
    health,
    impact,
    intelligence,
    parcels,
    projects,
    sih26016,
    spatial,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(parcels.router, prefix="/parcels", tags=["parcels"])
api_router.include_router(cases.router, prefix="/acquisition-cases", tags=["cases"])
api_router.include_router(intelligence.router, prefix="/projects", tags=["intelligence"])
api_router.include_router(impact.router, prefix="/impact", tags=["impact"])
api_router.include_router(spatial.router, prefix="/spatial", tags=["spatial"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
from app.api.deps import get_current_user_context
from fastapi import Depends

api_router.include_router(sih26016.router, prefix="/sih26016", tags=["sih26016"], dependencies=[Depends(get_current_user_context)])
