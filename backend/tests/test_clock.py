from datetime import datetime, timezone

from app.models.domain import AcquisitionCase, DurationType, StatutoryRule
from app.services.clock import compute_deadline, evaluate_deadline


def test_compute_deadline_calendar_days():
    triggered = datetime(2025, 1, 1, 12, 0, tzinfo=timezone.utc)
    rule = StatutoryRule(duration_type=DurationType.CALENDAR_DAYS.value, duration_value=60)
    deadline = compute_deadline(triggered, rule)
    assert deadline == datetime(2025, 3, 2, 12, 0, tzinfo=timezone.utc)

def test_evaluate_deadline_ok():
    triggered = datetime(2025, 1, 1, 12, 0, tzinfo=timezone.utc)
    now = datetime(2025, 1, 10, 12, 0, tzinfo=timezone.utc) # 9 days elapsed
    rule = StatutoryRule(
        rule_code="TEST_RULE",
        duration_type=DurationType.CALENDAR_DAYS.value, 
        duration_value=60,
        warning_threshold_days=15,
        statutory_citation="Sec 1",
        is_hard_lapse=True
    )
    case = AcquisitionCase(stage_started_at=triggered)
    
    result = evaluate_deadline(case, rule, now=now)
    assert result["status"] == "OK"
    assert result["days_remaining"] == 51

def test_evaluate_deadline_warning():
    triggered = datetime(2025, 1, 1, 12, 0, tzinfo=timezone.utc)
    now = datetime(2025, 2, 20, 12, 0, tzinfo=timezone.utc) 
    rule = StatutoryRule(
        rule_code="TEST_RULE",
        duration_type=DurationType.CALENDAR_DAYS.value, 
        duration_value=60,
        warning_threshold_days=15,
        statutory_citation="Sec 1"
    )
    case = AcquisitionCase(stage_started_at=triggered)
    
    result = evaluate_deadline(case, rule, now=now)
    assert result["status"] == "WARNING"

def test_evaluate_deadline_breach():
    triggered = datetime(2025, 1, 1, 12, 0, tzinfo=timezone.utc)
    now = datetime(2025, 3, 5, 12, 0, tzinfo=timezone.utc) 
    rule = StatutoryRule(
        rule_code="TEST_RULE",
        duration_type=DurationType.CALENDAR_DAYS.value, 
        duration_value=60,
        warning_threshold_days=15,
        statutory_citation="Sec 1",
        is_hard_lapse=True
    )
    case = AcquisitionCase(stage_started_at=triggered)
    
    result = evaluate_deadline(case, rule, now=now)
    assert result["status"] == "LAPSED"
