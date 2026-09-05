import uuid

import pytest

from app.core.database import AsyncSessionLocal
from app.models.domain import (
    AcquisitionCase,
    District,
    Parcel,
    Project,
    ProjectSegment,
    State,
    Village,
)
from app.services.spatial_engine import SpatialEngine


@pytest.mark.asyncio
async def test_spatial_engine_semantics():
    async with AsyncSessionLocal() as session:
        # Create State, District, Village
        st_id = uuid.uuid4()
        dt_id = uuid.uuid4()
        v_id = uuid.uuid4()
        session.add(State(id=st_id, name="Test State"))
        session.add(District(id=dt_id, name="Test District", state_id=st_id))
        session.add(Village(id=v_id, name="Test Village", district_id=dt_id))
        await session.flush()
        
        # Create an isolated project
        proj_id = uuid.uuid4()
        proj = Project(id=proj_id, name="Test Spatial Semantics Project", total_length_km=10.0)
        session.add(proj)
        
        # Segment 1
        seg1_id = uuid.uuid4()
        seg1 = ProjectSegment(id=seg1_id, project_id=proj_id, name="Test Segment 1", geom="SRID=4326;LINESTRING(0 0, 10 0)")
        session.add(seg1)
        
        # Segment 2
        seg2_id = uuid.uuid4()
        seg2 = ProjectSegment(id=seg2_id, project_id=proj_id, name="Test Segment 2", geom="SRID=4326;LINESTRING(0 10, 10 10)")
        session.add(seg2)
        await session.flush()

        from datetime import datetime, timezone

        from app.models.domain import ProjectActivity
        act = ProjectActivity(id=uuid.uuid4(), project_id=proj_id, segment_id=seg1_id, name="A1", duration_days=10, planned_start=datetime.now(timezone.utc), planned_finish=datetime.now(timezone.utc))
        session.add(act)

        # 1 & 2. Touching / Overlapping -> Unresolved Connected Chain A->B->C
        # A: (1, -1) to (3, 1)
        p_a = Parcel(id=uuid.uuid4(), project_id=proj_id, village_id=v_id, survey_no="A", area_hectares=1.0, geom="SRID=4326;MULTIPOLYGON(((1 -1, 1 1, 3 1, 3 -1, 1 -1)))")
        # B: (3, -1) to (5, 1) -> touches A
        p_b = Parcel(id=uuid.uuid4(), project_id=proj_id, village_id=v_id, survey_no="B", area_hectares=1.0, geom="SRID=4326;MULTIPOLYGON(((3 -1, 3 1, 5 1, 5 -1, 3 -1)))")
        # C: (4, -1) to (6, 1) -> overlaps B
        p_c = Parcel(id=uuid.uuid4(), project_id=proj_id, village_id=v_id, survey_no="C", area_hectares=1.0, geom="SRID=4326;MULTIPOLYGON(((4 -1, 4 1, 6 1, 6 -1, 4 -1)))")
        
        # 4. Resolved parcel excluded
        # D: (6, -1) to (8, 1) -> touches C, but is resolved
        p_d = Parcel(id=uuid.uuid4(), project_id=proj_id, village_id=v_id, survey_no="D", area_hectares=1.0, geom="SRID=4326;MULTIPOLYGON(((6 -1, 6 1, 8 1, 8 -1, 6 -1)))")
        
        # 6. Isolated unresolved parcel
        p_e = Parcel(id=uuid.uuid4(), project_id=proj_id, village_id=v_id, survey_no="E", area_hectares=1.0, geom="SRID=4326;MULTIPOLYGON(((0 9, 0 11, 2 11, 2 9, 0 9)))")
        
        # 9. Cross-project parcel excluded
        proj_other_id = uuid.uuid4()
        proj_other = Project(id=proj_other_id, name="Other Project", total_length_km=10.0)
        p_other = Parcel(id=uuid.uuid4(), project_id=proj_other_id, village_id=v_id, survey_no="Other", area_hectares=1.0, geom="SRID=4326;MULTIPOLYGON(((2 9, 2 11, 4 11, 4 9, 2 9)))") # touches E, but different project
        
        # 10. Invalid/null geometry
        p_null = Parcel(id=uuid.uuid4(), project_id=proj_id, village_id=v_id, survey_no="NULL", area_hectares=1.0, geom=None)
        
        session.add_all([p_a, p_b, p_c, p_d, p_e, proj_other, p_other, p_null])
        await session.flush()

        # Mark statuses
        # A, B, C, E, Other, NULL are unresolved (no possession)
        def add_case(p):
            return AcquisitionCase(id=uuid.uuid4(), parcel_id=p.id, statutory_act="RFCTLARR_2013", current_stage="DECLARATION")
        
        c_a, c_b, c_c, c_e, c_other, c_null = map(add_case, [p_a, p_b, p_c, p_e, p_other, p_null])
        
        # D is resolved (possession)
        c_d = AcquisitionCase(id=uuid.uuid4(), parcel_id=p_d.id, statutory_act="RFCTLARR_2013", current_stage="POSSESSION")
        
        session.add_all([c_a, c_b, c_c, c_d, c_e, c_other, c_null, c_d])
        await session.flush()

        # Run Spatial Engine
        engine = SpatialEngine(session)
        clusters = await engine.get_clusters(proj_id)
        
        try:
            assert len(clusters) == 2, f"Expected 2 clusters (A-B-C on Seg1, E on Seg2), got {len(clusters)}"
            
            # Find the chain cluster
            chain_cluster = next((c for c in clusters if "A" in c["survey_nos"]), None)
            assert chain_cluster, "Chain cluster missing"
            assert set(chain_cluster["survey_nos"]) == {"A", "B", "C"}, "Cluster should strictly be A, B, C"
            assert chain_cluster["segment"]["id"] == str(seg1_id), "Chain cluster should intersect Seg 1"
            
            # Find the isolated cluster
            isolated_cluster = next((c for c in clusters if "E" in c["survey_nos"]), None)
            assert isolated_cluster, "Isolated cluster missing"
            assert set(isolated_cluster["survey_nos"]) == {"E"}, "Cluster E should be isolated"
            assert isolated_cluster["segment"]["id"] == str(seg2_id), "Isolated cluster should intersect Seg 2"
            
            # Check exclusions
            all_survey_nos = [s for c in clusters for s in c["survey_nos"]]
            assert "D" not in all_survey_nos, "Resolved parcel D should be excluded"
            assert "Other" not in all_survey_nos, "Cross-project parcel should be excluded"
            assert "NULL" not in all_survey_nos, "Null geometry parcel should not crash and should be excluded from spatial clusters"
            
        finally:
            # Cleanup
            await session.rollback()
