from datetime import datetime, timedelta, timezone

from app.services.impact_engine import ImpactEngine
from app.services.schedule_engine import ScheduleEngine


def test_milestone_forecast_and_project_finish():
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    engine = ScheduleEngine(start)
    
    # Multiple activities affecting one milestone
    engine.add_activity("A1", 5, start, milestone_id="M1")
    engine.add_activity("A2", 10, start, milestone_id="M1")
    
    # Terminal activity dictating project finish
    engine.add_activity("A3", 15, start, milestone_id="M2")
    
    result = engine.calculate_cpm(start)
    
    # A1 EF = Jan 6. A2 EF = Jan 11. Milestone M1 = max(A1, A2) = Jan 11.
    assert result["milestones"]["M1"] == start + timedelta(days=10)
    
    # A3 EF = Jan 16. Terminal. Project finish = max(A1, A2, A3) EF = Jan 16.
    assert result["project_finish"] == start + timedelta(days=15)

def test_unknown_duration_and_no_blocker():
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    engine = ScheduleEngine(start)
    
    engine.add_activity("A", 5, start)
    
    # 0 duration block
    engine.add_constraint("A", "parcel_ok", 0)
    # Unknown duration block
    engine.add_constraint("A", "parcel_unknown", None)
    
    result = engine.calculate_cpm(start)
    
    # Engine calculates known delays (0), so it finishes at start + 5
    assert result["activities"]["A"]["EF"] == start + timedelta(days=5)
    # But warns of unknown constraint
    assert result["has_unknown_constraint"] is True

from app.models.domain import (
    AcquisitionCase,
    ActivityParcelRequirement,
    Parcel,
    ProjectActivity,
)


def test_workflow_stages(monkeypatch):
    import asyncio
    import uuid
    
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    proj_id = uuid.uuid4()
    
    # We will mock the database queries in ImpactEngine using a fake session
    class FakeQ:
        def __init__(self, data):
            self.data = data
        def scalars(self):
            return self
        def all(self):
            return self.data
        def first(self):
            return self.data[0] if self.data else None

    class FakeDB:
        async def execute(self, stmt):
            stmt_str = str(stmt)
            if "projects" in stmt_str:
                class P: id = proj_id
                return FakeQ([P()])
            if "project_activities" in stmt_str:
                a = ProjectActivity(id=uuid.uuid4(), project_id=proj_id, duration_days=5, planned_start=start, name="A")
                return FakeQ([a])
            if "activity_dependencies" in stmt_str:
                return FakeQ([])
            if "activity_parcel_requirements" in stmt_str:
                req1 = ActivityParcelRequirement(activity_id=uuid.uuid4(), parcel_id=uuid.uuid4(), required_stage="AWARD")
                req2 = ActivityParcelRequirement(activity_id=uuid.uuid4(), parcel_id=uuid.uuid4(), required_stage="POSSESSION")
                # Hack to attach activity_id explicitly for the test
                self.req1 = req1
                self.req2 = req2
                return FakeQ([req1, req2])
            if "parcels" in stmt_str:
                p1 = Parcel(id=self.req1.parcel_id, project_id=proj_id, possession_type="DECLARATION") # Before AWARD
                p2 = Parcel(id=self.req2.parcel_id, project_id=proj_id, possession_type="INITIAL") # Will use case stage
                self.p1 = p1
                self.p2 = p2
                return FakeQ([p1, p2])
            if "acquisition_cases" in stmt_str:
                c1 = AcquisitionCase(id=uuid.uuid4(), parcel_id=self.p1.id, current_stage="DECLARATION", is_lapsed=False)
                c2 = AcquisitionCase(id=uuid.uuid4(), parcel_id=self.p2.id, current_stage="POSSESSION", is_lapsed=False) # Meets POSSESSION
                return FakeQ([c1, c2])
            if "workflow_blockers" in stmt_str:
                return FakeQ([])
            return FakeQ([])

    engine = ImpactEngine(db=FakeDB(), analysis_date=start)
    asyncio.run(engine.load_project(proj_id))
    
    # Requirement 1: Needs AWARD. Parcel is DECLARATION (index 3 < 4). NOT MET.
    # Requirement 2: Needs POSSESSION. Parcel is INITIAL, but case is POSSESSION (index 6 >= 6). MET.
    assert str(engine.db.req1.parcel_id) in engine.bottleneck_evidence
    assert str(engine.db.req2.parcel_id) not in engine.bottleneck_evidence

def test_complete_causal_traversal():
    engine = ImpactEngine(db=None, analysis_date=datetime(2025, 1, 1, tzinfo=timezone.utc))
    class FakeCase: id = "C1"
    class FakeCase2: id = "C2"
    class FakeReq:
        def __init__(self, p): self.parcel_id = p
    engine.domain_cache = {"cases": {"P1": [FakeCase(), FakeCase2()]}, "blockers": {}, "reqs": {"A1": [FakeReq("P1")]}}
    engine.project_start_date = datetime(2025, 1, 1, tzinfo=timezone.utc)
    
    engine.current_engine.add_activity("A1", 5, engine.project_start_date, name="Dig", milestone_id="M1")
    
    # Mock CPM result
    mock_result = {
        "activities": {
            "A1": {
                "name": "Dig",
                "milestone_id": "M1", "is_critical": True
            }
        }
    }
    
    # Mock evidence with MULTIPLE cases
    evidence = {
        "parcel_id": "P1",
        "cases": ["C1", "C2"],
        "blockers": [],
        "affected_activities": {"A1"}
    }
    
    paths = engine._get_causal_path(mock_result, ["A1"], evidence)
    
    # Should yield: C1 -> P1, C2 -> P1, P1 -> A1, A1 -> M1, M1 -> Project Finish
    # Total hops: 5
    assert len(paths) == 5
    assert paths[0]["source_id"] == "C1"
    assert paths[0]["target_id"] == "P1"
    assert paths[1]["source_id"] == "C2"
    assert paths[1]["target_id"] == "P1"
    
    assert paths[2]["source_id"] == "P1"
    assert paths[2]["target_id"] == "A1"
    assert paths[2]["relationship"] == "REQUIRED_BY"
    
    assert paths[3]["source_id"] == "A1"
    assert paths[3]["target_id"] == "M1"
    
    assert paths[4]["source_id"] == "M1"
    assert paths[4]["target_id"] == "PROJECT_FINISH"
