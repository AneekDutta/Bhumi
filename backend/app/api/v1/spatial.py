import logging
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import TrustedIdentity, get_current_user_context
from app.core.database import get_db
from app.services.authorization import AuthorizationService
from app.services.spatial_engine import SpatialEngine

from app.services.sih26016_service import sih_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/{project_id}/clusters", response_model=list[dict[str, Any]])
async def get_spatial_clusters(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: TrustedIdentity = Depends(get_current_user_context)
):
    """
    Returns contiguous clusters of unresolved parcels and their intersections with segments,
    including critical path delays fetched from the ImpactEngine.
    """
    await AuthorizationService.verify_project_access(current_user, str(project_id), db)
    try:
        uuid_obj = UUID(project_id)
        engine = SpatialEngine(db)
        return await engine.get_clusters(uuid_obj)
    except (ValueError, Exception) as e:
        logger.debug(f"Non-UUID project ID or DB spatial error: {e}")
        return []


@router.get("/{project_id}/geojson", response_model=dict[str, Any])
async def get_spatial_geojson(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: TrustedIdentity = Depends(get_current_user_context)
):
    """
    Returns raw GeoJSON feature collections for MapLibre rendering.
    """
    await AuthorizationService.verify_project_access(current_user, str(project_id), db)
    try:
        uuid_obj = UUID(project_id)
        engine = SpatialEngine(db)
        return await engine.get_project_geojson(uuid_obj)
    except (ValueError, Exception) as e:
        logger.debug(f"Non-UUID project ID or DB spatial error: {e}")
        pass

    parcels_fc = sih_service.get_parcels_geojson(project_id)
    return {
        "segments": {
            "type": "FeatureCollection",
            "features": []
        },
        "parcels": parcels_fc
    }
