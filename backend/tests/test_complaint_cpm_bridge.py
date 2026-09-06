import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

from app.core.database import AsyncSessionLocal
from app.main import app
from app.services.complaint_cpm_bridge import (
    activate_complaint_blocker,
    classify_complaint,
    deactivate_complaint_blocker,
    normalize_parcel_id,
)
from app.services.sih26016_service import sih_service


@pytest.fixture(autouse=True)
async def clean_db():
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("DELETE FROM documents WHERE document_type = 'landowner_complaint'"))
            await session.execute(text("DELETE FROM dependency_edges WHERE from_node_type = 'complaint'"))
            await session.execute(text("UPDATE dependency_edges SET is_blocking = FALSE WHERE from_node_type = 'parcel' AND to_node_type = 'project_segment' AND from_node_id = 'P00003'"))
            await session.commit()
    except Exception as e:
        pytest.skip(f"Database not available: {e}")
    yield
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("DELETE FROM documents WHERE document_type = 'landowner_complaint'"))
            await session.execute(text("DELETE FROM dependency_edges WHERE from_node_type = 'complaint'"))
            await session.execute(text("UPDATE dependency_edges SET is_blocking = FALSE WHERE from_node_type = 'parcel' AND to_node_type = 'project_segment' AND from_node_id = 'P00003'"))
            await session.commit()
    except Exception:
        pass


def test_parcel_id_normalization():
    assert normalize_parcel_id("P003") == "P00003"
    assert normalize_parcel_id("P-00003") == "P00003"
    assert normalize_parcel_id("3") == "P00003"
    assert normalize_parcel_id("P00003") == "P00003"
    assert normalize_parcel_id("p00125") == "P00125"


def test_complaint_classification():
    # Impact-bearing categories
    boundary = classify_complaint("Land measurement / boundary mismatch", "CRITICAL")
    assert boundary["is_impact_bearing"] is True
    assert boundary["auto_activate"] is True
    assert boundary["default_weight_days"] == 35.0

    title = classify_complaint("Incorrect ownership / title dispute", "HIGH")
    assert title["is_impact_bearing"] is True
    assert title["auto_activate"] is True
    assert title["default_weight_days"] == 45.0

    possession = classify_complaint("Unauthorized physical possession", "NORMAL")
    assert possession["is_impact_bearing"] is True
    assert possession["auto_activate"] is False
    assert possession["default_weight_days"] == 60.0

    # Informational categories
    mutation = classify_complaint("Document / Jamabandi mutation issue", "NORMAL")
    assert mutation["is_impact_bearing"] is False
    assert mutation["auto_activate"] is False
    assert mutation["default_weight_days"] == 0.0


@pytest.mark.asyncio
async def test_full_complaint_to_cpm_and_gis_lifecycle():
    transport = ASGITransport(app=app)
    headers_owner = {"x-mock-role": "LANDOWNER", "x-mock-user-id": "O00003"}
    headers_officer = {"x-mock-role": "OFFICER", "x-mock-user-id": "OF001"}
    headers_admin = {"x-mock-role": "ADMIN", "x-mock-user-id": "ADMIN_01"}

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Baseline: P00003 should NOT be on critical path
        res_geojson = await ac.get("/api/v1/sih26016/projects/P-NH927A/parcels/geojson")
        assert res_geojson.status_code == 200
        geojson_data = res_geojson.json()
        p3_feature = next((f for f in geojson_data["features"] if f["properties"]["parcel_id"] == "P00003"), None)
        assert p3_feature is not None
        assert p3_feature["properties"]["is_critical_path"] is False

        # 2. Landowner submits CRITICAL Boundary Dispute on P003 (triggers auto-activation)
        submit_payload = {
            "complaint_type": "Land measurement / boundary mismatch",
            "description": "Corridor fence encroaches 8 meters into registered title boundaries.",
            "owner_id": "O00003",
            "owner_name": "Ramesh Chandra",
            "parcel_id": "P003",
            "priority": "CRITICAL",
            "document_evidence": {"title_deed": "TD-9988"}
        }
        res_submit = await ac.post("/api/v1/landowner/complaints", headers=headers_owner, json=submit_payload)
        assert res_submit.status_code == 200
        complaint_id = res_submit.json()["complaint_id"]
        assert complaint_id.startswith("CMP-")

        # Verify PostgreSQL dependency_edges table has the blocking edge
        async with AsyncSessionLocal() as session:
            db_edge = await session.execute(text("""
                SELECT * FROM dependency_edges
                WHERE from_node_type = 'complaint' AND from_node_id = :cid
            """), {"cid": complaint_id})
            edge_row = db_edge.mappings().first()
            assert edge_row is not None
            assert edge_row["to_node_id"] == "P00003"
            assert edge_row["is_blocking"] is True
            assert float(edge_row["weight_days"]) == 35.0

            # Downstream segment edge should be gated (is_blocking = True)
            segment_edge = await session.execute(text("""
                SELECT is_blocking FROM dependency_edges
                WHERE from_node_type = 'parcel' AND from_node_id = 'P00003' AND to_node_type = 'project_segment'
            """))
            assert segment_edge.scalar() is True

        # 3. GIS Cadastral Layer: P00003 should now be flagged as is_critical_path=True
        res_geojson_after = await ac.get("/api/v1/sih26016/projects/P-NH927A/parcels/geojson")
        assert res_geojson_after.status_code == 200
        p3_blocked = next(f for f in res_geojson_after.json()["features"] if f["properties"]["parcel_id"] == "P00003")
        assert p3_blocked["properties"]["is_critical_path"] is True
        assert p3_blocked["properties"]["ownership_conflict"] is True

        # Critical Path Report should list P00003 in critical_path_parcels
        res_cp = await ac.get("/api/v1/sih26016/projects/P-NH927A/critical-path")
        assert res_cp.status_code == 200
        cp_report = res_cp.json()
        assert "P00003" in cp_report["critical_path_parcels"]

        # 4. What-If Simulation: Test counterfactual resolution without modifying production database
        sim_payload = {
            "intervention_type": "RESOLVE_BLOCKER",
            "input_entity_ids": ["P00003"],
            "acceleration_factor": 1.0
        }
        res_sim = await ac.post("/api/v1/sih26016/projects/P-NH927A/simulate", json=sim_payload)
        assert res_sim.status_code == 200
        sim_data = res_sim.json()
        assert sim_data["preconditions_met"] is True
        assert "P00003" in sim_data["target_entities"]

        # Confirm production DB edge is STILL blocking after simulation
        async with AsyncSessionLocal() as session:
            still_blocked = await session.execute(text("""
                SELECT is_blocking FROM dependency_edges
                WHERE from_node_type = 'complaint' AND from_node_id = :cid
            """), {"cid": complaint_id})
            assert still_blocked.scalar() is True

        # 5. Admin resolves complaint: Deactivates blocker & clears critical path
        resolve_payload = {
            "resolution_action": "RESOLVED",
            "resolution_notes": "Revenue demarcation finalized; boundary pillars repositioned."
        }
        res_resolve = await ac.post(f"/api/v1/landowner/complaints/{complaint_id}/resolve", headers=headers_admin, json=resolve_payload)
        assert res_resolve.status_code == 200

        # Confirm dependency edge in DB is now unblocked
        async with AsyncSessionLocal() as session:
            unblocked_edge = await session.execute(text("""
                SELECT is_blocking FROM dependency_edges
                WHERE from_node_type = 'complaint' AND from_node_id = :cid
            """), {"cid": complaint_id})
            assert unblocked_edge.scalar() is False

            # Parcel -> Segment edge is unblocked
            unblocked_seg = await session.execute(text("""
                SELECT is_blocking FROM dependency_edges
                WHERE from_node_type = 'parcel' AND from_node_id = 'P00003' AND to_node_type = 'project_segment'
            """))
            assert unblocked_seg.scalar() is False

        # GIS Cadastral Layer: P00003 is no longer critical path
        res_geojson_resolved = await ac.get("/api/v1/sih26016/projects/P-NH927A/parcels/geojson")
        assert res_geojson_resolved.status_code == 200
        p3_resolved = next(f for f in res_geojson_resolved.json()["features"] if f["properties"]["parcel_id"] == "P00003")
        assert p3_resolved["properties"]["is_critical_path"] is False
        assert p3_resolved["properties"]["ownership_conflict"] is False


@pytest.mark.asyncio
async def test_field_verification_lifecycle_blocker():
    transport = ASGITransport(app=app)
    headers_owner = {"x-mock-role": "LANDOWNER", "x-mock-user-id": "O00003"}
    headers_officer = {"x-mock-role": "OFFICER", "x-mock-user-id": "OF001"}
    headers_admin = {"x-mock-role": "ADMIN", "x-mock-user-id": "ADMIN_01"}

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Submit NORMAL priority grievance (does not auto-activate blocker)
        submit_payload = {
            "complaint_type": "Incorrect ownership / title dispute",
            "description": "Partition deed pending revenue registration.",
            "owner_id": "O00003",
            "owner_name": "Ramesh Chandra",
            "parcel_id": "P00003",
            "priority": "NORMAL",
            "document_evidence": {}
        }
        res_submit = await ac.post("/api/v1/landowner/complaints", headers=headers_owner, json=submit_payload)
        complaint_id = res_submit.json()["complaint_id"]

        # Field Officer verifies dispute as valid -> Activates blocker
        verify_payload = {
            "complaint_id": complaint_id,
            "notes": "Field inspection confirms competing claims on partition deed.",
            "is_valid": True
        }
        res_verify = await ac.post(f"/api/v1/landowner/complaints/{complaint_id}/verify", headers=headers_officer, json=verify_payload)
        assert res_verify.status_code == 200

        # Check DB edge
        async with AsyncSessionLocal() as session:
            db_edge = await session.execute(text("""
                SELECT is_blocking FROM dependency_edges
                WHERE from_node_type = 'complaint' AND from_node_id = :cid
            """), {"cid": complaint_id})
            assert db_edge.scalar() is True

        # Clean up by resolving
        await ac.post(f"/api/v1/landowner/complaints/{complaint_id}/resolve", headers=headers_admin, json={
            "resolution_action": "RESOLVED",
            "resolution_notes": "Cleaned up"
        })


@pytest.mark.asyncio
async def test_rbac_boundary_isolation():
    transport = ASGITransport(app=app)
    headers_owner = {"x-mock-role": "LANDOWNER", "x-mock-user-id": "O00001"}

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Landowner cannot resolve complaints
        res_resolve = await ac.post("/api/v1/landowner/complaints/CMP-TEST/resolve", headers=headers_owner, json={
            "resolution_action": "RESOLVED",
            "resolution_notes": "Attempt unauthorized resolve"
        })
        assert res_resolve.status_code == 403

        # Landowner cannot verify complaints
        res_verify = await ac.post("/api/v1/landowner/complaints/CMP-TEST/verify", headers=headers_owner, json={
            "complaint_id": "CMP-TEST",
            "notes": "Attempt unauthorized verify",
            "is_valid": True
        })
        assert res_verify.status_code == 403
