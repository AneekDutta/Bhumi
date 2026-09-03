from enum import Enum

from geoalchemy2 import Geometry
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class UserRole(str, Enum):
    CENTRAL_ADMIN = "CENTRAL_ADMIN"
    STATE_ADMIN = "STATE_ADMIN"
    DISTRICT_OFFICER = "DISTRICT_OFFICER"
    FIELD_OFFICER = "FIELD_OFFICER"
    AUDITOR = "AUDITOR"

class WorkflowStage(str, Enum):
    INITIAL = "INITIAL"
    PRELIMINARY_NOTIFICATION = "PRELIMINARY_NOTIFICATION" # e.g., Sec 11 or 3A
    OBJECTIONS = "OBJECTIONS"                             # e.g., Sec 15 or 3C
    DECLARATION = "DECLARATION"                           # e.g., Sec 19 or 3D
    AWARD = "AWARD"                                       # e.g., Sec 23/25 or 3G
    COMPENSATION = "COMPENSATION"                         # e.g., Sec 38 or 3H
    POSSESSION = "POSSESSION"

class DurationType(str, Enum):
    CALENDAR_DAYS = "CALENDAR_DAYS"
    MONTHS = "MONTHS"
    YEARS = "YEARS"

class State(BaseModel):
    __tablename__ = "states"
    name = Column(String, nullable=False, unique=True)
    districts = relationship("District", back_populates="state")

class District(BaseModel):
    __tablename__ = "districts"
    state_id = Column(UUID(as_uuid=True), ForeignKey("states.id"), nullable=False)
    name = Column(String, nullable=False)
    state = relationship("State", back_populates="districts")
    villages = relationship("Village", back_populates="district")

class Village(BaseModel):
    __tablename__ = "villages"
    district_id = Column(UUID(as_uuid=True), ForeignKey("districts.id"), nullable=False)
    name = Column(String, nullable=False)
    district = relationship("District", back_populates="villages")

class User(BaseModel):
    __tablename__ = "users"
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False, default=UserRole.FIELD_OFFICER.value)
    assigned_state_id = Column(UUID(as_uuid=True), ForeignKey("states.id"), nullable=True)
    assigned_district_id = Column(UUID(as_uuid=True), ForeignKey("districts.id"), nullable=True)

class Project(BaseModel):
    __tablename__ = "projects"
    name = Column(String, nullable=False)
    total_length_km = Column(Float, nullable=True)
    state_id = Column(UUID(as_uuid=True), ForeignKey("states.id"), nullable=True)
    segments = relationship("ProjectSegment", back_populates="project")
    parcels = relationship("Parcel", back_populates="project")

class ProjectSegment(BaseModel):
    __tablename__ = "project_segments"
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False)
    start_km = Column(Float, nullable=True)
    end_km = Column(Float, nullable=True)
    geom = Column(Geometry('LINESTRING', srid=4326), nullable=True)
    project = relationship("Project", back_populates="segments")
    milestones = relationship("Milestone", back_populates="segment")

class Milestone(BaseModel):
    __tablename__ = "milestones"
    segment_id = Column(UUID(as_uuid=True), ForeignKey("project_segments.id"), nullable=False)
    name = Column(String, nullable=False)
    target_date = Column(DateTime(timezone=True), nullable=True) 
    status = Column(String, nullable=False, default="PENDING")
    segment = relationship("ProjectSegment", back_populates="milestones")

class Parcel(BaseModel):
    __tablename__ = "parcels"
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    village_id = Column(UUID(as_uuid=True), ForeignKey("villages.id"), nullable=False)
    survey_no = Column(String, nullable=False)
    area_hectares = Column(Float, nullable=False)
    classification = Column(String, nullable=True)
    geom = Column(Geometry('MULTIPOLYGON', srid=4326), nullable=True)
    possession_type = Column(String, nullable=True) # PHYSICAL, SYMBOLIC, DISPUTED, PENDING
    status = Column(String, nullable=False, default="IN_PROGRESS")

    project = relationship("Project", back_populates="parcels")
    owners = relationship("ParcelOwnership", back_populates="parcel")
    cases = relationship("AcquisitionCase", back_populates="parcel")

class Owner(BaseModel):
    __tablename__ = "owners"
    name = Column(String, nullable=False)
    contact = Column(String, nullable=True)
    aadhaar_hash = Column(String, nullable=True)
    parcels = relationship("ParcelOwnership", back_populates="owner")

class ParcelOwnership(BaseModel):
    __tablename__ = "parcel_ownership"
    parcel_id = Column(UUID(as_uuid=True), ForeignKey("parcels.id"), nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("owners.id"), nullable=False)
    share_pct = Column(Float, nullable=False, default=100.0)
    is_disputed = Column(Boolean, nullable=False, default=False)

    parcel = relationship("Parcel", back_populates="owners")
    owner = relationship("Owner", back_populates="parcels")

class AcquisitionCase(BaseModel):
    __tablename__ = "acquisition_cases"
    parcel_id = Column(UUID(as_uuid=True), ForeignKey("parcels.id"), nullable=False)
    statutory_act = Column(String, nullable=False) 
    current_stage = Column(String, nullable=False, default=WorkflowStage.INITIAL.value)
    stage_started_at = Column(DateTime(timezone=True), nullable=True) 
    computed_deadline = Column(DateTime(timezone=True), nullable=True) 
    is_lapsed = Column(Boolean, nullable=False, default=False)
    lapse_risk_flag = Column(Boolean, nullable=False, default=False)

    parcel = relationship("Parcel", back_populates="cases")

class StatutoryRule(BaseModel):
    __tablename__ = "statutory_rules"
    rule_code = Column(String, unique=True, index=True, nullable=False)
    act_code = Column(String, nullable=False)
    trigger_stage = Column(String, nullable=False)
    target_stage = Column(String, nullable=False)
    duration_value = Column(Integer, nullable=False)
    duration_type = Column(String, nullable=False, default=DurationType.CALENDAR_DAYS.value)
    warning_threshold_days = Column(Integer, nullable=False)
    is_hard_lapse = Column(Boolean, nullable=False, default=True)
    statutory_citation = Column(String, nullable=False)

class AuditLog(BaseModel):
    __tablename__ = "audit_logs"
    actor_id = Column(String, nullable=True) 
    actor_role = Column(String, nullable=True)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    state_before = Column(JSONB, nullable=True)
    state_after = Column(JSONB, nullable=True)
    source = Column(String, nullable=True)

class ParcelSegment(BaseModel):
    __tablename__ = "parcel_segments"
    parcel_id = Column(UUID(as_uuid=True), ForeignKey("parcels.id"), nullable=False)
    segment_id = Column(UUID(as_uuid=True), ForeignKey("project_segments.id"), nullable=False)
    intersection_area_hectares = Column(Float, nullable=True)

class WorkflowBlocker(BaseModel):
    __tablename__ = "workflow_blockers"
    parcel_id = Column(UUID(as_uuid=True), ForeignKey("parcels.id"), nullable=False)
    blocker_type = Column(String, nullable=False) # e.g. LITIGATION, MISSING_DOCS, FUNDS_DELAY
    status = Column(String, nullable=False, default="ACTIVE") # ACTIVE, RESOLVED
    description = Column(String, nullable=True)

class ProjectActivity(BaseModel):
    __tablename__ = "project_activities"
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    segment_id = Column(UUID(as_uuid=True), ForeignKey("project_segments.id"), nullable=True)
    name = Column(String, nullable=False)
    duration_days = Column(Integer, nullable=False)
    planned_start = Column(DateTime(timezone=True), nullable=False)
    planned_finish = Column(DateTime(timezone=True), nullable=False)
    actual_start = Column(DateTime(timezone=True), nullable=True)
    actual_finish = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, nullable=False, default="PLANNED")
    
    project = relationship("Project", back_populates="activities")
    dependencies_as_successor = relationship("ActivityDependency", foreign_keys="[ActivityDependency.successor_id]", back_populates="successor")
    dependencies_as_predecessor = relationship("ActivityDependency", foreign_keys="[ActivityDependency.predecessor_id]", back_populates="predecessor")

class ActivityDependency(BaseModel):
    __tablename__ = "activity_dependencies"
    predecessor_id = Column(UUID(as_uuid=True), ForeignKey("project_activities.id"), nullable=False)
    successor_id = Column(UUID(as_uuid=True), ForeignKey("project_activities.id"), nullable=False)
    dependency_type = Column(String, nullable=False, default="FINISH_TO_START")
    
    predecessor = relationship("ProjectActivity", foreign_keys=[predecessor_id], back_populates="dependencies_as_predecessor")
    successor = relationship("ProjectActivity", foreign_keys=[successor_id], back_populates="dependencies_as_successor")

Project.activities = relationship("ProjectActivity", back_populates="project")

class ActivityParcelRequirement(BaseModel):
    __tablename__ = "activity_parcel_requirements"
    activity_id = Column(UUID(as_uuid=True), ForeignKey("project_activities.id"), nullable=False)
    parcel_id = Column(UUID(as_uuid=True), ForeignKey("parcels.id"), nullable=False)
    required_stage = Column(String, nullable=False, default="POSSESSION")
    
    activity = relationship("ProjectActivity", back_populates="parcel_requirements")
    parcel = relationship("Parcel")

ProjectActivity.parcel_requirements = relationship("ActivityParcelRequirement", back_populates="activity")
ProjectActivity.milestone_id = Column(UUID(as_uuid=True), ForeignKey("milestones.id"), nullable=True)
ProjectActivity.milestone = relationship("Milestone", foreign_keys=[ProjectActivity.milestone_id])

# Add explicit demo assumption fields to Blocker and Case to remove hardcoded engine values
WorkflowBlocker.assumed_resolution_days = Column(Integer, nullable=True) 
AcquisitionCase.assumed_lapse_recovery_days = Column(Integer, nullable=True)
