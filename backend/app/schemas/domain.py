from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.domain import WorkflowStage


class ParcelBase(BaseModel):
    survey_no: str
    area_hectares: float
    classification: str | None = None
    possession_type: str | None = None
    status: str

class ParcelRead(ParcelBase):
    id: UUID
    project_id: UUID
    village_id: UUID
    model_config = ConfigDict(from_attributes=True)

class ProjectBase(BaseModel):
    name: str
    total_length_km: float | None = None

class ProjectRead(ProjectBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)

class AcquisitionCaseBase(BaseModel):
    statutory_act: str
    current_stage: str
    stage_started_at: datetime | None = None
    computed_deadline: datetime | None = None
    is_lapsed: bool
    lapse_risk_flag: bool

class AcquisitionCaseRead(AcquisitionCaseBase):
    id: UUID
    parcel_id: UUID
    model_config = ConfigDict(from_attributes=True)

class CaseTransitionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    new_stage: WorkflowStage
    # Removed actor_id and actor_role from request schema. Security fix.

class AuditLogRead(BaseModel):
    id: UUID
    action: str
    actor_id: str | None
    actor_role: str | None
    state_before: dict | None
    state_after: dict | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

AcquisitionCaseRead.model_rebuild()

class DocumentVersionRead(BaseModel):
    id: UUID
    document_id: UUID
    version_number: int
    original_filename: str
    mime_type: str
    size_bytes: int
    sha256_hash: str
    uploaded_by_id: str
    uploaded_by_role: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DocumentBase(BaseModel):
    title: str
    description: str | None = None
    document_type: str

class DocumentCreate(DocumentBase):
    project_id: UUID | None = None
    parcel_id: UUID | None = None
    acquisition_case_id: UUID | None = None

class DocumentRead(DocumentBase):
    id: UUID
    project_id: UUID | None
    parcel_id: UUID | None
    acquisition_case_id: UUID | None
    current_version: int
    status: str
    created_at: datetime
    updated_at: datetime
    versions: list[DocumentVersionRead] = []
    model_config = ConfigDict(from_attributes=True)
