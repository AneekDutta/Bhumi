from datetime import datetime, timezone

from dateutil.relativedelta import relativedelta

from app.models.domain import AcquisitionCase, DurationType, StatutoryRule


def compute_deadline(triggered_at: datetime, rule: StatutoryRule) -> datetime:
    """Computes a strict deadline based on duration_type. Returns UTC datetime."""
    if rule.duration_type == DurationType.CALENDAR_DAYS.value:
        return triggered_at + relativedelta(days=rule.duration_value)
    elif rule.duration_type == DurationType.MONTHS.value:
        return triggered_at + relativedelta(months=rule.duration_value)
    elif rule.duration_type == DurationType.YEARS.value:
        return triggered_at + relativedelta(years=rule.duration_value)
    raise ValueError(f"Unknown duration_type: {rule.duration_type}")

def evaluate_deadline(case: AcquisitionCase, rule: StatutoryRule, now: datetime | None = None) -> dict:
    if now is None:
        now = datetime.now(timezone.utc)
    
    if not case.stage_started_at:
        return None
        
    deadline = compute_deadline(case.stage_started_at, rule)
    
    delta = deadline - now
    days_remaining = delta.days
    days_elapsed = (now - case.stage_started_at).days
    
    status = "OK"
    if days_remaining < 0:
        status = "BREACHED" if not rule.is_hard_lapse else "LAPSED"
    elif days_remaining <= rule.warning_threshold_days:
        status = "WARNING"
        
    return {
        "rule": rule.rule_code,
        "triggered_at": case.stage_started_at.isoformat(),
        "deadline": deadline.isoformat(),
        "days_elapsed": days_elapsed,
        "days_remaining": days_remaining,
        "status": status,
        "source": rule.statutory_citation
    }
