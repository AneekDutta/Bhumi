import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.sih26016_service import sih_service


def test_get_field_officers():
    officers = sih_service.get_field_officers()
    assert len(officers) >= 6
    patwari = next((o for o in officers if o["officer_id"] == "OF005"), None)
    assert patwari is not None
    assert patwari["name"] == "Girdhari Rathore"
    assert "V01" in patwari["assigned_villages"]
    assert patwari["pending_tasks_count"] > 0


def test_get_officer_parcels():
    parcels = sih_service.get_officer_parcels(officer_id="OF005")
    assert len(parcels) > 0
    p = parcels[0]
    assert "survey_number" in p
    assert "village_id" in p
    assert "area_hectares" in p
    assert "verification_status" in p


def test_field_issue_reporting_causal_chain():
    # 1. Target parcel
    target_pid = "P00007"
    parcel_before = sih_service.get_parcel_detail(target_pid)
    assert parcel_before is not None

    before_risk = float(parcel_before["risk_score"])
    
    # 2. Report Ownership Mismatch via field verification
    report = {
        "parcel_id": target_pid,
        "officer_id": "OF005",
        "officer_name": "Girdhari Rathore (Patwari)",
        "verification_type": "ownership",
        "status": "rejected",
        "has_issue": True,
        "issue_type": "ownership_mismatch",
        "issue_severity": "HIGH",
        "gps_lat": 24.651234,
        "gps_lng": 75.932456,
        "gps_accuracy": 3.5,
        "measured_area_sqm": 12500.0,
        "observations": "Boundary disputed by neighboring title holder; two competing succession claims presented on site.",
        "remarks": "Escalate immediately to Revenue Lok Adalat.",
        "photos": [
            {
                "caption": "Boundary Pillar 4 Displaced",
                "category": "boundary",
                "timestamp": "2026-09-05T14:30:00Z"
            }
        ]
    }

    result = sih_service.record_field_verification(report)

    # 3. Assertions on Immediate Causal Propagation
    assert result["success"] is True
    assert result["has_issue"] is True
    assert result["issue_type"] == "ownership_mismatch"
    assert result["status"] == "rejected"
    assert result["source_type"] == "USER_ENTERED"

    # Parcel status & conflict updated
    parcel_after = sih_service.get_parcel_detail(target_pid)
    assert parcel_after["ownership_conflict"] is True
    assert parcel_after["conflict_type"] == "ownership_mismatch"

    # Risk score increased due to statutory ownership dispute penalty
    assert float(result["updated_risk_score"]) >= before_risk

    # Audit log generated
    assert result["audit_log_id"] is not None
    assert "Field Alert" in result["notification"]["title"]
    assert result["notification"]["urgency"] == "CRITICAL"


@pytest.mark.asyncio
async def test_field_api_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Test list officers
        res_officers = await ac.get("/api/v1/sih26016/field/officers")
        assert res_officers.status_code == 200
        officers_data = res_officers.json()
        assert len(officers_data) >= 6

        # Test list parcels
        res_parcels = await ac.get("/api/v1/sih26016/field/parcels?officer_id=OF002")
        assert res_parcels.status_code == 200
        parcels_data = res_parcels.json()
        assert len(parcels_data) > 0

        # Test submit clean verification
        payload = {
            "parcel_id": "P00008",
            "officer_id": "OF002",
            "officer_name": "Kamla Jat",
            "verification_type": "field",
            "status": "verified",
            "has_issue": False,
            "boundary_confirmed": True,
            "observations": "Boundary verified against DGPS coordinates. Owner in undisputed possession."
        }
        res_submit = await ac.post("/api/v1/sih26016/field/verify", json=payload)
        assert res_submit.status_code == 200
        submit_data = res_submit.json()
        assert submit_data["success"] is True
        assert submit_data["has_issue"] is False


@pytest.mark.asyncio
async def test_field_incident_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. List incidents
        res = await ac.get("/api/v1/sih26016/field/incidents")
        assert res.status_code == 200
        incidents = res.json()
        assert len(incidents) > 0
        inc = incidents[0]
        inc_id = inc["verification_id"]

        # 2. Field Officer confirms incident with GPS & observations
        confirm_payload = {
            "officer_name": "Ramesh Patel",
            "observation_notes": "Ground verification complete. Dispute confirmed between co-owners.",
            "gps_latitude": 24.6495,
            "gps_longitude": 75.9288,
            "confirmed_severity": "CRITICAL_STOPPAGE"
        }
        res_confirm = await ac.patch(f"/api/v1/sih26016/field/incidents/{inc_id}/confirm", json=confirm_payload)
        assert res_confirm.status_code == 200
        confirm_data = res_confirm.json()
        assert confirm_data["status"] == "confirmed"
        assert confirm_data["gps_lat"] == 24.6495
        assert confirm_data["confirming_officer_name"] == "Ramesh Patel"

        # 3. Admin reviews and resolves incident
        resolve_payload = {
            "resolution_action": "RESOLVE",
            "resolution_comment": "Title dispute resolved via Revenue Lok Adalat award agreement.",
            "admin_name": "CALA Officer Sharma"
        }
        res_resolve = await ac.patch(f"/api/v1/sih26016/admin/incidents/{inc_id}/resolve", json=resolve_payload)
        assert res_resolve.status_code == 200
        resolve_data = res_resolve.json()
        assert resolve_data["resolution_status"] == "resolved"
        assert resolve_data["incident"]["status"] == "resolved"
        assert resolve_data["incident"]["admin_resolution"]["action"].lower() == "resolved"

