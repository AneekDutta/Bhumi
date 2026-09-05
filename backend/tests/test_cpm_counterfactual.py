from datetime import datetime, timedelta, timezone

from app.services.impact_engine import ImpactEngine
from app.services.schedule_engine import ScheduleEngine


def test_cpm_parallel_counterfactual():
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    engine = ImpactEngine(db=None, analysis_date=start)
    engine.domain_cache = {"cases": {}, "blockers": {}, "reqs": {}}
    engine.project_start_date = start
    
    # Issue A delays Activity A by 10 days. Issue B delays parallel Activity B by 10 days.
    engine.baseline_engine.add_activity("A", 5, start)
    engine.baseline_engine.add_activity("B", 5, start)
    
    engine.current_engine.add_activity("A", 5, start)
    engine.current_engine.add_activity("B", 5, start)
    
    engine.current_engine.add_constraint("A", "parcel_A", 10)
    engine.current_engine.add_constraint("B", "parcel_B", 10)
    
    engine.bottleneck_evidence = {
        "parcel_A": {
            "parcel_id": "parcel_A",
            "delay_days": 10,
            "urgency": "CRITICAL",
            "reason": "Test",
            "cases": [],
            "blockers": [],
            "affected_activities": {"A"}
        },
        "parcel_B": {
            "parcel_id": "parcel_B",
            "delay_days": 10,
            "urgency": "CRITICAL",
            "reason": "Test",
            "cases": [],
            "blockers": [],
            "affected_activities": {"B"}
        }
    }
    

    class FakeReq:
        def __init__(self, p):
            self.parcel_id = p
            
    for parcel_id, evidence in engine.bottleneck_evidence.items():
        for act in evidence["affected_activities"]:
            engine.domain_cache["reqs"].setdefault(str(act), []).append(FakeReq(parcel_id))
            
    impact = engine.analyze_impact()
    
    # Baseline project finish: Start + 5 days = Jan 6
    assert impact["baseline"]["project_finish"] == start + timedelta(days=5)
    
    # Current forecast: Both delayed by 10. Start + 10 delay + 5 duration = Jan 16 (10 days delay)
    assert impact["current_forecast"]["project_finish"] == start + timedelta(days=15)
    assert impact["current_forecast"]["project_delay_days"] == 10
    
    # Removing A alone: B is still delayed by 10. Recoverable delay = 0!
    bottleneck_a = next(b for b in impact["bottlenecks"] if b["parcel_id"] == "parcel_A")
    assert bottleneck_a["project_delay_days"] == 0
    
    # Removing B alone: A is still delayed by 10. Recoverable delay = 0!
    bottleneck_b = next(b for b in impact["bottlenecks"] if b["parcel_id"] == "parcel_B")
    assert bottleneck_b["project_delay_days"] == 0

def test_urgent_no_impact_vs_lower_urgency_high_impact():
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    engine = ImpactEngine(db=None, analysis_date=start)
    engine.domain_cache = {"cases": {}, "blockers": {}, "reqs": {}}
    engine.project_start_date = start
    
    engine.baseline_engine.add_activity("A", 5, start)  # Critical path
    engine.baseline_engine.add_activity("B", 5, start)  # Parallel non-critical (after constraints applied)
    
    engine.current_engine.add_activity("A", 5, start)
    engine.current_engine.add_activity("B", 5, start)
    
    # A gets 15 days delay (low urgency), B gets 5 days delay (critical urgency)
    engine.current_engine.add_constraint("A", "parcel_A", 15)
    engine.current_engine.add_constraint("B", "parcel_B", 5)
    
    engine.bottleneck_evidence = {
        "parcel_A": {
            "parcel_id": "parcel_A",
            "delay_days": 15,
            "urgency": "LOW",
            "reason": "Test",
            "cases": [],
            "blockers": [],
            "affected_activities": {"A"}
        },
        "parcel_B": {
            "parcel_id": "parcel_B",
            "delay_days": 5,
            "urgency": "CRITICAL",
            "reason": "Test",
            "cases": [],
            "blockers": [],
            "affected_activities": {"B"}
        }
    }
    

    class FakeReq:
        def __init__(self, p):
            self.parcel_id = p
            
    for parcel_id, evidence in engine.bottleneck_evidence.items():
        for act in evidence["affected_activities"]:
            engine.domain_cache["reqs"].setdefault(str(act), []).append(FakeReq(parcel_id))
            
    impact = engine.analyze_impact()
    
    # A pushes project by 15. B only pushes by 5. Total delay is 15.
    # B's counterfactual: remove B's 5. A is still 15. Recoverable = 0.
    # A's counterfactual: remove A's 15. B is still 5. Project finishes at 5+5=10. Recoverable = 10.
    
    bottlenecks = impact["bottlenecks"]
    
    assert bottlenecks[0]["parcel_id"] == "parcel_A"
    assert bottlenecks[0]["project_delay_days"] == 10
    
    assert bottlenecks[1]["parcel_id"] == "parcel_B"
    assert bottlenecks[1]["project_delay_days"] == 0

def test_unsupported_intervention():
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    engine = ImpactEngine(db=None, analysis_date=start)
    engine.domain_cache = {"cases": {}, "blockers": {}, "reqs": {}}
    try:
        engine.simulate_intervention({"type": "HIRE_PEOPLE", "parcel_id": "P1"})
        assert False, "Should raise ValueError"
    except ValueError as e:
        assert str(e) == "Intervention type not currently supported"

def test_two_parcels_one_activity():
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    engine = ImpactEngine(db=None, analysis_date=start)
    engine.domain_cache = {"cases": {}, "blockers": {}, "reqs": {}}
    engine.project_start_date = start
    
    engine.baseline_engine.add_activity("A", 10, start)
    engine.current_engine.add_activity("A", 10, start)
    
    # Parcel 1 delays by 10, Parcel 2 delays by 20. Total delay on A should be max(10, 20) = 20.
    engine.current_engine.add_constraint("A", "parcel_1", 10)
    engine.current_engine.add_constraint("A", "parcel_2", 20)
    
    engine.bottleneck_evidence = {
        "parcel_1": {
            "parcel_id": "parcel_1",
            "delay_days": 10,
            "urgency": "HIGH",
            "reason": "Test",
            "cases": [],
            "blockers": [],
            "affected_activities": {"A"}
        },
        "parcel_2": {
            "parcel_id": "parcel_2",
            "delay_days": 20,
            "urgency": "HIGH",
            "reason": "Test",
            "cases": [],
            "blockers": [],
            "affected_activities": {"A"}
        }
    }
    

    class FakeReq:
        def __init__(self, p):
            self.parcel_id = p
            
    for parcel_id, evidence in engine.bottleneck_evidence.items():
        for act in evidence["affected_activities"]:
            engine.domain_cache["reqs"].setdefault(str(act), []).append(FakeReq(parcel_id))
            
    impact = engine.analyze_impact()
    assert impact["current_forecast"]["project_delay_days"] == 20
    
    # If we resolve parcel_1, delay drops from 20 to 20. Recovered = 0.
    sim_1 = engine.simulate_intervention({"type": "RESOLVE_BLOCKER", "parcel_id": "parcel_1"})
    assert sim_1["days_recovered"] == 0
    
    # If we resolve parcel_2, delay drops from 20 to 10. Recovered = 10.
    sim_2 = engine.simulate_intervention({"type": "RESOLVE_BLOCKER", "parcel_id": "parcel_2"})
    assert sim_2["days_recovered"] == 10

def test_missing_requirement_data():
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    engine = ImpactEngine(db=None, analysis_date=start)
    engine.domain_cache = {"cases": {}, "blockers": {}, "reqs": {}}
    engine.project_start_date = start
    
    engine.baseline_engine.add_activity("A", 10, start)
    engine.current_engine.add_activity("A", 10, start)
    
    # Missing explicit assumption = 0 days delay
    engine.current_engine.add_constraint("A", "parcel_unknown", 0)
    
    engine.bottleneck_evidence = {
        "parcel_unknown": {
            "parcel_id": "parcel_unknown",
            "delay_days": 0,
            "urgency": "LOW",
            "reason": "Unknown",
            "cases": [],
            "blockers": [],
            "affected_activities": {"A"}
        }
    }
    

    class FakeReq:
        def __init__(self, p):
            self.parcel_id = p
            
    for parcel_id, evidence in engine.bottleneck_evidence.items():
        for act in evidence["affected_activities"]:
            engine.domain_cache["reqs"].setdefault(str(act), []).append(FakeReq(parcel_id))
            
    impact = engine.analyze_impact()
    assert impact["current_forecast"]["project_delay_days"] == 0

def test_circular_dependency():
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    engine = ScheduleEngine(start)
    engine.add_activity("A", 10, start)
    engine.add_activity("B", 10, start)
    engine.add_dependency("A", "B")
    engine.add_dependency("B", "A")
    
    try:
        engine.calculate_cpm(start)
        assert False, "Should raise ValueError for cycle"
    except ValueError as e:
        assert "cycle" in str(e).lower()

