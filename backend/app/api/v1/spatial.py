from typing import Dict, Any, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.api.deps import TrustedIdentity, get_current_user_context
from app.core.database import get_db
from app.services.spatial_engine import SpatialEngine
from app.services.authorization import AuthorizationService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/{project_id}/clusters", response_model=List[Dict[str, Any]])
async def get_spatial_clusters(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TrustedIdentity = Depends(get_current_user_context)
):
    """
    Returns contiguous clusters of unresolved parcels and their intersections with segments,
    including critical path delays fetched from the ImpactEngine.
    """
    await AuthorizationService.verify_project_access(current_user, str(project_id), db)
    engine = SpatialEngine(db)
    try:
        clusters = await engine.get_clusters(project_id)
        return clusters
    except Exception as e:
        logger.error(f"Spatial error: {e}")
        raise HTTPException(status_code=500, detail="Internal spatial engine error")


@router.get("/{project_id}/geojson", response_model=Dict[str, Any])
async def get_spatial_geojson(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: TrustedIdentity = Depends(get_current_user_context)
):
    """
    Returns raw GeoJSON feature collections for MapLibre rendering.
    """
    await AuthorizationService.verify_project_access(current_user, str(project_id), db)
    engine = SpatialEngine(db)
    try:
        geojson_data = await engine.get_project_geojson(project_id)
        return geojson_data
    except Exception as e:
        logger.error(f"GeoJSON error: {e}")
        raise HTTPException(status_code=500, detail="Internal spatial engine error")
