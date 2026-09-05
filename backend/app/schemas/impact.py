from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ScheduleActivityInfo(BaseModel):
    name: str
    milestone_id: str | None
    ES: datetime
    EF: datetime
    LS: datetime
    LF: datetime
    float_days: int
    is_critical: bool
    duration_days: int
    constraints: dict

class ScheduleForecast(BaseModel):
    project_finish: datetime
    critical_path: list[str]
    project_delay_days: int | None = None
    impact_status: str = "QUANTIFIED_IMPACT" # NO_BLOCKING_CONSTRAINT, QUANTIFIED_IMPACT, UNQUANTIFIED_IMPACT

class CausalHop(BaseModel):
    source_type: str
    source_id: str
    source_label: str
    relationship: str
    target_type: str
    target_id: str
    target_label: str

class BottleneckEvidence(BaseModel):
    parcel_id: str
    delay_days: int | None
    urgency: str
    reason: str
    cases: list[str]
    blockers: list[str]
    is_critical_path: bool
    project_delay_days: int | None
    causal_path: list[CausalHop]

class ProjectImpactResponse(BaseModel):
    baseline: ScheduleForecast
    current_forecast: ScheduleForecast
    bottlenecks: list[BottleneckEvidence]

class SimulationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: str # e.g. RESOLVE_BLOCKER
    parcel_id: str

class SimulationResult(BaseModel):
    before: ScheduleForecast
    after: ScheduleForecast
    days_recovered: int
