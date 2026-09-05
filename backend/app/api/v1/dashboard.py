from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, Query

from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.api.deps import TrustedIdentity, get_current_user_context
from app.services.dashboard_service import DashboardService

router = APIRouter()

class DashboardSummaryResponse(BaseModel):
    total_projects: int
    delayed_projects: int
    unresolved_parcels: int
    total_spatial_clusters: int
    critical_path_blocked_projects: int

class ProjectDashboardRow(BaseModel):
    project_id: UUID
    name: str
    state_id: Optional[UUID]
    baseline_finish: Optional[datetime]
    current_finish: Optional[datetime]
    project_delay_days: int
    critical_path_blocked: bool
    unresolved_parcel_count: int
    spatial_cluster_count: int
    highest_urgency: str
    centroid: Optional[Dict[str, Any]]

class DashboardProjectsResponse(BaseModel):
    total: int
    page: int
    size: int
    items: List[ProjectDashboardRow]

class MISReportResponse(BaseModel):
    report_type: str
    generated_at: datetime
    rows: List[Dict[str, Any]]

@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    identity: TrustedIdentity = Depends(get_current_user_context)
):
    svc = DashboardService(db, identity)
    return await svc.get_portfolio_summary()

@router.get("/projects", response_model=DashboardProjectsResponse)
async def get_dashboard_projects(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=500),
    sort_by: str = Query("delay", pattern="^(delay|unresolved_parcels|finish_date|name)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
    identity: TrustedIdentity = Depends(get_current_user_context)
):
    svc = DashboardService(db, identity)
    impacts = await svc.get_projects_impact()

    # Sorting
    if sort_by == "delay":
        key = lambda x: x["project_delay_days"]
    elif sort_by == "unresolved_parcels":
        key = lambda x: x["unresolved_parcel_count"]
    elif sort_by == "finish_date":
        key = lambda x: x["current_finish"] if x["current_finish"] else datetime.min
    else:
        key = lambda x: x["name"]

    impacts.sort(key=key, reverse=(order == "desc"))

    # Pagination
    total = len(impacts)
    start = (page - 1) * size
    end = start + size
    items = impacts[start:end]

    return DashboardProjectsResponse(
        total=total,
        page=page,
        size=size,
        items=[ProjectDashboardRow(**item) for item in items]
    )

@router.get("/reports", response_model=MISReportResponse)
async def get_dashboard_reports(
    report_type: str = Query(..., pattern="^(project_status|acquisition_status|delay_impact|critical_blockers|spatial_blockage|milestone_exposure)$"),
    db: AsyncSession = Depends(get_db),
    identity: TrustedIdentity = Depends(get_current_user_context)
):
    svc = DashboardService(db, identity)
    rows = await svc.get_reports(report_type)

    return MISReportResponse(
        report_type=report_type,
        generated_at=datetime.utcnow(),
        rows=rows
    )
