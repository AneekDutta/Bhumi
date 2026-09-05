from datetime import datetime, timezone

from app.services.impact_engine import ImpactEngine


def prep_engine(engine):
    class FakeReq:
        def __init__(self, p): self.parcel_id = p
    class FakeCase:
        def __init__(self, i): self.id = i
    class FakeBlocker:
        def __init__(self, i): self.id = i
    engine.domain_cache = {"cases": {}, "blockers": {}, "reqs": {}}
    for parcel_id, evidence in engine.bottleneck_evidence.items():
        for act in evidence.get("affected_activities", []):
            engine.domain_cache["reqs"].setdefault(str(act), []).append(FakeReq(parcel_id))
        for c in evidence.get("cases", []):
            engine.domain_cache["cases"].setdefault(str(parcel_id), []).append(FakeCase(c))
        for b in evidence.get("blockers", []):
            engine.domain_cache["blockers"].setdefault(str(parcel_id), []).append(FakeBlocker(b))

def test_impact_engine_bottleneck_ranking():
    engine = ImpactEngine(db=None, analysis_date=datetime(2025, 1, 1, tzinfo=timezone.utc))
    engine.project_start_date = datetime(2025, 1, 1, tzinfo=timezone.utc)
    engine.baseline_engine.add_activity("A", 10, engine.project_start_date)
    engine.baseline_engine.add_activity("B", 10, engine.project_start_date)
    engine.current_engine.add_activity("A", 10, engine.project_start_date)
    engine.current_engine.add_activity("B", 10, engine.project_start_date)
    
    engine.baseline_engine.add_activity("C", 10, engine.project_start_date)
    engine.baseline_engine.add_dependency("A", "C")
    engine.current_engine.add_activity("C", 10, engine.project_start_date)
    engine.current_engine.add_dependency("A", "C")
    
    engine.current_engine.add_constraint("B", "parcel_B", 5)
    engine.bottleneck_evidence["parcel_B"] = {
        "parcel_id": "parcel_B",
        "delay_days": 5, "urgency": "CRITICAL", "reason": "Lapse",
        "cases": ["case_1"], "blockers": [], "affected_activities": {"B"}
    }
    
    engine.current_engine.add_constraint("A", "parcel_A", 5)
    engine.bottleneck_evidence["parcel_A"] = {
        "parcel_id": "parcel_A",
        "delay_days": 5, "urgency": "HIGH", "reason": "Blocker",
        "cases": [], "blockers": ["blocker_1"], "affected_activities": {"A"}
    }
    
    prep_engine(engine)
    impact = engine.analyze_impact()
    
    assert len(impact["bottlenecks"]) == 2
    assert impact["bottlenecks"][0]["parcel_id"] == "parcel_A"
    assert impact["bottlenecks"][1]["parcel_id"] == "parcel_B"

def test_simulation_non_destructive():
    engine = ImpactEngine(db=None, analysis_date=datetime(2025, 1, 1, tzinfo=timezone.utc))
    engine.project_start_date = datetime(2025, 1, 1, tzinfo=timezone.utc)
    engine.baseline_engine.add_activity("A", 10, engine.project_start_date)
    engine.current_engine.add_activity("A", 10, engine.project_start_date)
    
    engine.current_engine.add_constraint("A", "parcel_A", 10)
    engine.bottleneck_evidence["parcel_A"] = {
        "parcel_id": "parcel_A",
        "delay_days": 10, "urgency": "CRITICAL", "reason": "Lapse",
        "cases": [], "blockers": [], "affected_activities": {"A"}
    }
    prep_engine(engine)
    engine.analyze_impact()
    
    assert engine.current_engine.graph.nodes["A"]["constraints"]["parcel_A"] == 10
    
    payload = {"type": "RESOLVE_BLOCKER", "parcel_id": "parcel_A"}
    engine.simulate_intervention(payload)
    
    assert engine.current_engine.graph.nodes["A"]["constraints"]["parcel_A"] == 10
