from datetime import datetime, timedelta, timezone

from app.services.schedule_engine import ScheduleEngine


def test_cpm_parallel_work():
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    engine = ScheduleEngine(start)
    
    # A = 5
    # B = 10 after A
    # C = 3 after A
    # D = 4 after B, C
    
    engine.add_activity("A", 5, start)
    engine.add_activity("B", 10, start)
    engine.add_activity("C", 3, start)
    engine.add_activity("D", 4, start)
    
    engine.add_dependency("A", "B")
    engine.add_dependency("A", "C")
    engine.add_dependency("B", "D")
    engine.add_dependency("C", "D")
    
    result = engine.calculate_cpm(start)
    
    # Project should finish 19 days after start
    assert result["project_finish"] == start + timedelta(days=19)
    
    # C should have float because B (10) > C (3)
    assert result["activities"]["C"]["float_days"] == 7
    assert result["activities"]["C"]["is_critical"] is False
    
    # B should be critical
    assert result["activities"]["B"]["is_critical"] is True

def test_parallel_delay_resolution():
    start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    engine = ScheduleEngine(start)
    
    # Two independent parallel activities
    engine.add_activity("A", 5, start)
    engine.add_activity("B", 5, start)
    
    # Delay both by 10 days
    engine.add_constraint("A", "parcel_A", 10)
    engine.add_constraint("B", "parcel_B", 10)
    
    res1 = engine.calculate_cpm(start)
    # Finish is start + 10 delay + 5 duration = 15
    assert res1["project_finish"] == start + timedelta(days=15)
    
    # Resolve one delay (What-if intervention)
    engine.remove_constraint("A", "parcel_A")
    res2 = engine.calculate_cpm(start)
    
    # Project finish remains 15 because B is still delayed by 10 and takes 5
    assert res2["project_finish"] == start + timedelta(days=15)
    
    # Resolve both
    engine.remove_constraint("B", "parcel_B")
    res3 = engine.calculate_cpm(start)
    
    assert res3["project_finish"] == start + timedelta(days=5)

