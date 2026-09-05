"""
FastAPI Router for SIH26016 Land Acquisition Digital Twin
Exposes endpoints for corridors, cadastral parcels, GeoJSON map layers,
Section 13 parcel dossiers, CPM critical path analysis, and What-If simulation.
Preserves source_type provenance on every response.
"""
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.schemas.sih26016 import (
    CriticalPathResponse,
    SimulationRequest,
    SimulationResponse,
)
from app.services.sih26016_service import sih_service

router = APIRouter()


@router.get("/projects", response_model=list[dict[str, Any]])
def list_projects():
    """List all digital twin projects with CPM schedules and provenance."""
    return sih_service.get_projects()


@router.get("/projects/{project_id}", response_model=dict[str, Any])
def get_project(project_id: str):
    """Retrieve detailed project corridor specifications."""
    proj = sih_service.get_project_by_id(project_id)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return proj


@router.get("/projects/{project_id}/parcels", response_model=list[dict[str, Any]])
def list_parcels(
    project_id: str,
    status: str | None = Query(None, description="Filter by acquisition_status"),
    critical_only: bool = Query(False, description="Filter only critical-chain parcels")
):
    """List parcels for the specified corridor."""
    parcels = sih_service.get_parcels(project_id)
    if status:
        parcels = [p for p in parcels if p.get("acquisition_status") == status]
    if critical_only:
        parcels = [p for p in parcels if p.get("is_critical_path")]
    return parcels


@router.get("/projects/{project_id}/parcels/geojson")
@router.get("/projects/{project_id}/geojson")
def get_parcels_geojson(project_id: str):
    """
    Returns GeoJSON FeatureCollection of all cadastral parcels.
    Properties contain styling variables for Normal, Risk, and Critical Path modes.
    """
    return sih_service.get_parcels_geojson(project_id)


@router.get("/parcels/{parcel_id}", response_model=dict[str, Any])
def get_parcel_detail(parcel_id: str):
    """
    Returns Section 13 full parcel dossier:
    owner, village, area, acquisition status, compensation, R&R, legal disputes,
    documents, verifications, dependencies, criticality score, risk score, and
    MODEL_DERIVED recommended action.
    """
    detail = sih_service.get_parcel_detail(parcel_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Parcel {parcel_id} not found")
    return detail


@router.get("/projects/{project_id}/critical-path", response_model=CriticalPathResponse)
def get_critical_path(project_id: str):
    """
    Returns CPM Critical Path Method schedule report, zero-float bottlenecks,
    and causal blocking chains.
    """
    return sih_service.get_critical_path_report(project_id)


@router.post("/projects/{project_id}/simulate", response_model=SimulationResponse)
def simulate_intervention(project_id: str, req: SimulationRequest):
    """
    Executes Section 12 What-If simulation by mutating the in-memory dependency graph
    and computing the CPM delay reduction diff.
    """
    res = sih_service.simulate(
        project_id=project_id,
        intervention_type=req.intervention_type,
        input_entity_ids=req.input_entity_ids,
        acceleration_factor=req.acceleration_factor or 1.0
    )
    return res


@router.get("/projects/{project_id}/summary")
def get_corridor_summary(project_id: str):
    """Aggregated command center KPI summary for the SIH26016 corridor."""
    proj = sih_service.get_project_by_id(project_id)
    parcels = sih_service.get_parcels(project_id)
    cpm = sih_service.get_critical_path_report(project_id)

    total_parcels = len(parcels)
    possessed_count = sum(1 for p in parcels if p.get("acquisition_status") == "possessed")
    disputed_count = sum(1 for p in parcels if p.get("ownership_conflict") or (p.get("risk_score") or 0) >= 50)
    critical_count = sum(1 for p in parcels if p.get("is_critical_path"))

    total_area_sqm = sum(float(p.get("area_sqm") or 0) for p in parcels)
    total_area_ha = round(total_area_sqm / 10000.0, 2)

    return {
        "project_id": proj.get("project_id") if proj else project_id,
        "name": proj.get("name") if proj else "NH-927A Kota-Jhalawar Bypass Widening",
        "total_parcels": total_parcels,
        "possessed_parcels": possessed_count,
        "unresolved_parcels": total_parcels - possessed_count,
        "disputed_parcels": disputed_count,
        "critical_path_parcels": critical_count,
        "total_area_hectares": total_area_ha,
        "project_delay_days": cpm.get("project_delay_days", 0),
        "target_completion": proj.get("target_completion", "2028-03-31"),
        "projected_completion": cpm.get("projected_finish", "2028-11-15"),
        "source_type": "MODEL_DERIVED"
    }
