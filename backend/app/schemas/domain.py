from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.domain import WorkflowStage


class ParcelBase(BaseModel):
    survey_no: str
    area_hectares: float
    classification: Optional[str] = None
    possession_type: Optional[str] = None
    status: str

class ParcelRead(ParcelBase):
    id: UUID
    project_id: UUID
    village_id: UUID
    model_config = ConfigDict(from_attributes=True)

class ProjectBase(BaseModel):
    name: str
    total_length_km: Optional[float] = None

class ProjectRead(ProjectBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)

class AcquisitionCaseBase(BaseModel):
    statutory_act: str
    current_stage: str
    stage_started_at: Optional[datetime] = None
    computed_deadline: Optional[datetime] = None
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
    actor_id: Optional[str]
    actor_role: Optional[str]
    state_before: Optional[dict]
    state_after: Optional[dict]
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
    description: Optional[str] = None
    document_type: str

class DocumentCreate(DocumentBase):
    project_id: Optional[UUID] = None
    parcel_id: Optional[UUID] = None
    acquisition_case_id: Optional[UUID] = None

class DocumentRead(DocumentBase):
    id: UUID
    project_id: Optional[UUID]
    parcel_id: Optional[UUID]
    acquisition_case_id: Optional[UUID]
    current_version: int
    status: str
    created_at: datetime
    updated_at: datetime
    versions: list[DocumentVersionRead] = []
    model_config = ConfigDict(from_attributes=True)
