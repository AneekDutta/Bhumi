from typing import Dict, Any, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.spatial_engine import SpatialEngine

router = APIRouter()


@router.get("/{project_id}/clusters", response_model=List[Dict[str, Any]])
async def get_spatial_clusters(
    project_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Returns contiguous clusters of unresolved parcels and their intersections with segments,
    including critical path delays fetched from the ImpactEngine.
    """
    engine = SpatialEngine(db)
    try:
        clusters = await engine.get_clusters(project_id)
        return clusters
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}/geojson", response_model=Dict[str, Any])
async def get_spatial_geojson(
    project_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Returns raw GeoJSON feature collections for MapLibre rendering.
    """
    engine = SpatialEngine(db)
    try:
        geojson_data = await engine.get_project_geojson(project_id)
        return geojson_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
