from datetime import datetime, timedelta, timezone

from app.services.schedule_engine import ScheduleEngine


def test_two_constraints_on_one_activity_uses_max():
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    engine = ScheduleEngine(start)
    engine.add_activity("A", 10, start)
    engine.add_constraint("A", "C1", 10)
    engine.add_constraint("A", "C2", 20)
    
    result = engine.calculate_cpm(start)
    # A should start on day 20 (MAX of 10 and 20), finish on day 30 (20 + 10 duration)
    assert result["activities"]["A"]["ES"] == start + timedelta(days=20)
    assert result["activities"]["A"]["EF"] == start + timedelta(days=30)
    
def test_constraints_on_sequential_activities():
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    engine = ScheduleEngine(start)
    engine.add_activity("A", 5, start)
    engine.add_activity("B", 5, start)
    engine.add_dependency("A", "B")
    
    engine.add_constraint("A", "C1", 10)
    engine.add_constraint("B", "C2", 20)
    
    result = engine.calculate_cpm(start)
    # A starts on day 10, ends day 15.
    assert result["activities"]["A"]["ES"] == start + timedelta(days=10)
    assert result["activities"]["A"]["EF"] == start + timedelta(days=15)
    
    # B waits for A (EF=15). B has its own constraint C2=20 (from project start).
    # delayed_start = max(15, start + 20) = 20.
    assert result["activities"]["B"]["ES"] == start + timedelta(days=20)
    assert result["activities"]["B"]["EF"] == start + timedelta(days=25)
    
def test_parallel_branches_not_incorrectly_summed():
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    engine = ScheduleEngine(start)
    engine.add_activity("A", 10, start)
    engine.add_activity("B", 10, start)
    engine.add_constraint("A", "C1", 10) # A finishes at 20
    engine.add_constraint("B", "C2", 15) # B finishes at 25
    
    result = engine.calculate_cpm(start)
    # Project finish should be max(A, B) = 25. NOT 10 + 10 + 10 + 15
    assert result["project_finish"] == start + timedelta(days=25)

def test_counterfactual_removal():
    from app.services.impact_engine import ImpactEngine
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    engine = ImpactEngine(db=None, analysis_date=start)
    engine.project_start_date = start
    engine.domain_cache = {"cases": {}, "blockers": {}, "reqs": {}}
    
    engine.current_engine.add_activity("A", 10, start)
    engine.current_engine.add_constraint("A", "P1", 10)
    engine.current_engine.add_constraint("A", "P2", 20)
    
    # Simulate resolving P1.
    engine.bottleneck_evidence = {
        "P1": {"affected_activities": ["A"]},
        "P2": {"affected_activities": ["A"]}
    }
    
    # Baseline project finish: max(0) + 10 = 10
    # Current project finish: max(10, 20) + 10 = 30
    
    # Remove P1 -> P2 remains (20). Finish = 30. Recovered = 0.
    sim_p1 = engine.simulate_intervention({"type": "RESOLVE_BLOCKER", "parcel_id": "P1"})
    assert sim_p1["days_recovered"] == 0
    assert sim_p1["after"]["project_finish"] == start + timedelta(days=30)
    
    # Remove P2 -> P1 remains (10). Finish = 20. Recovered = 10.
    sim_p2 = engine.simulate_intervention({"type": "RESOLVE_BLOCKER", "parcel_id": "P2"})
    assert sim_p2["days_recovered"] == 10
    assert sim_p2["after"]["project_finish"] == start + timedelta(days=20)
    
    # The current_forecast was NOT mutated by either simulation
    current = engine.current_engine.calculate_cpm(start)
    assert current["project_finish"] == start + timedelta(days=30)
