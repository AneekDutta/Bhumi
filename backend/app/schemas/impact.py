from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from uuid import UUID

class ScheduleActivityInfo(BaseModel):
    name: str
    milestone_id: Optional[str]
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
    critical_path: List[str]
    project_delay_days: Optional[int] = None
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
    delay_days: Optional[int]
    urgency: str
    reason: str
    cases: List[str]
    blockers: List[str]
    is_critical_path: bool
    project_delay_days: Optional[int]
    causal_path: List[CausalHop]

class ProjectImpactResponse(BaseModel):
    baseline: ScheduleForecast
    current_forecast: ScheduleForecast
    bottlenecks: List[BottleneckEvidence]

class SimulationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: str # e.g. RESOLVE_BLOCKER
    parcel_id: str

class SimulationResult(BaseModel):
    before: ScheduleForecast
    after: ScheduleForecast
    days_recovered: int
