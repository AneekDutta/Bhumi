"""
Tests for Explainable Acquisition Risk Engine
SIH26016 Land Acquisition Platform - KOSH
10 Transparent Risk Dimensions, 'Why?' Rationale, CPM Float Linkage & RBAC
"""
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.schemas.acquisition_risk import RiskDimensionType, RiskSeverity
from app.services.acquisition_risk_engine import acquisition_risk_engine


@pytest.mark.asyncio
async def test_all_10_risk_dimensions_evaluated():
    """Verify that all 10 transparent risk dimensions are evaluated for a parcel."""
    dossier = await acquisition_risk_engine.evaluate_parcel_risk("P00001")
    assert dossier.parcel_id == "P00001"
    assert len(dossier.dimensions) == 10

    dimension_types = {dim.dimension for dim in dossier.dimensions}
    expected_types = {
        RiskDimensionType.STATUTORY_RISK,
        RiskDimensionType.PROCEDURAL_RISK,
        RiskDimensionType.DOCUMENT_RISK,
        RiskDimensionType.COMPENSATION_RISK,
        RiskDimensionType.TITLE_RISK,
        RiskDimensionType.DISPUTE_RISK,
        RiskDimensionType.POSSESSION_RISK,
        RiskDimensionType.R_AND_R_RISK,
        RiskDimensionType.PROJECT_EXECUTION_RISK,
        RiskDimensionType.DATA_QUALITY_RISK,
    }
    assert dimension_types == expected_types

    # Every dimension must explain "Why?" via at least one factor
    for dim in dossier.dimensions:
        assert 0.0 <= dim.confidence_score <= 1.0
        assert dim.severity in [RiskSeverity.LOW, RiskSeverity.MEDIUM, RiskSeverity.HIGH, RiskSeverity.CRITICAL]
        assert len(dim.factors) >= 1
        for factor in dim.factors:
            assert isinstance(factor, str)
            assert len(factor) > 5


@pytest.mark.asyncio
async def test_composite_risk_summary_and_why_explanation():
    """Verify composite severity calculation and transparent 'Why?' rationale."""
    dossier = await acquisition_risk_engine.evaluate_parcel_risk("P00003")
    assert dossier.overall_highest_severity in [RiskSeverity.LOW, RiskSeverity.MEDIUM, RiskSeverity.HIGH, RiskSeverity.CRITICAL]
    assert len(dossier.why_explanation_summary) > 10
    assert dossier.primary_risk_dimension is not None
    assert dossier.disclaimer is not None


@pytest.mark.asyncio
async def test_risk_api_rbac_and_idor():
    """Verify officer access vs landowner 403 and horizontal project boundary isolation."""
    transport = ASGITransport(app=app)
    headers_officer = {"x-mock-role": "OFFICER", "x-mock-user-id": "OFF-001"}
    headers_landowner = {"x-mock-role": "LANDOWNER", "x-mock-user-id": "O00001"}
    headers_wrong_project = {
        "x-mock-role": "OFFICER",
        "x-mock-user-id": "OFF-DIFF-PROJ",
        "x-mock-project-id": "P-OTHER-PROJECT",
    }

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Landowner is forbidden from viewing internal risk dossiers
        res_landowner = await ac.get("/api/v1/risk/parcel/P00001", headers=headers_landowner)
        assert res_landowner.status_code == 403

        # 2. Authorized officer can access
        res_officer = await ac.get("/api/v1/risk/parcel/P00001", headers=headers_officer)
        assert res_officer.status_code == 200
        data = res_officer.json()
        assert data["parcel_id"] == "P00001"
        assert "dimensions" in data
        assert len(data["dimensions"]) == 10

        # 3. Horizontal IDOR: Officer assigned to different project is rejected
        res_idor = await ac.get("/api/v1/risk/parcel/P00001", headers=headers_wrong_project)
        assert res_idor.status_code == 403
        assert "Forbidden" in res_idor.json()["detail"]


@pytest.mark.asyncio
async def test_project_risk_summary_api():
    """Verify project risk summary endpoint aggregates risk severity counts."""
    transport = ASGITransport(app=app)
    headers_officer = {"x-mock-role": "OFFICER", "x-mock-user-id": "OFF-001"}

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/risk/project/P-NH927A/summary", headers=headers_officer)
        assert res.status_code == 200
        summary = res.json()
        assert summary["project_id"] == "P-NH927A"
        assert summary["total_parcels_evaluated"] > 0
        assert "critical_risk_count" in summary
        assert "high_risk_count" in summary
        assert "top_risk_parcels" in summary
