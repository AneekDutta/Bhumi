"""
SIH26016 Land Acquisition Digital Twin — Domain Models
Strictly mirrors data/sih26016/schema_postgis.sql.
All models enforce source_type: REAL_PUBLIC | SYNTHETIC | USER_ENTERED | MODEL_DERIVED.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Table,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, relationship

try:
    from geoalchemy2 import Geometry
    HAS_GEO = True
except ImportError:
    Geometry = None
    HAS_GEO = False

SIHBase = declarative_base()


class SIHProject(SIHBase):
    __tablename__ = "projects"

    project_id = Column(Text, primary_key=True)
    name = Column(Text, nullable=False)
    project_type = Column(Text, nullable=False)  # highway, railway, metro, etc.
    state = Column(Text, nullable=True)
    district = Column(Text, nullable=True)
    if HAS_GEO:
        alignment = Column(Geometry("LINESTRING", srid=4326), nullable=True)
    else:
        alignment = Column(Text, nullable=True)
    estimated_cost = Column(Numeric, nullable=True)
    start_date = Column(Date, nullable=True)
    target_completion = Column(Date, nullable=True)
    projected_completion = Column(Date, nullable=True)  # MODEL_DERIVED
    status = Column(Text, nullable=True)  # planning | in_progress | delayed | completed

    # Provenance fields
    source_type = Column(Text, nullable=False, default="SYNTHETIC")
    source = Column(Text, nullable=True)
    source_url = Column(Text, nullable=True)
    source_timestamp = Column(DateTime(timezone=True), nullable=True)
    verification_status = Column(Text, nullable=True)
    confidence = Column(Numeric, nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

    villages = relationship("SIHVillage", back_populates="project", cascade="all, delete-orphan")
    parcels = relationship("SIHParcel", back_populates="project", cascade="all, delete-orphan")
    segments = relationship("SIHProjectSegment", back_populates="project", cascade="all, delete-orphan")
    milestones = relationship("SIHMilestone", back_populates="project", cascade="all, delete-orphan")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "project_id": self.project_id,
            "name": self.name,
            "project_type": self.project_type,
            "state": self.state,
            "district": self.district,
            "estimated_cost": float(self.estimated_cost) if self.estimated_cost is not None else None,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "target_completion": self.target_completion.isoformat() if self.target_completion else None,
            "projected_completion": self.projected_completion.isoformat() if self.projected_completion else None,
            "status": self.status,
            "source_type": self.source_type,
            "source": self.source,
            "source_url": self.source_url,
            "source_timestamp": self.source_timestamp.isoformat() if self.source_timestamp else None,
            "verification_status": self.verification_status,
            "confidence": float(self.confidence) if self.confidence is not None else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class SIHVillage(SIHBase):
    __tablename__ = "villages"

    village_id = Column(Text, primary_key=True)
    project_id = Column(Text, ForeignKey("projects.project_id"), nullable=True)
    name = Column(Text, nullable=False)
    tehsil = Column(Text, nullable=True)
    district = Column(Text, nullable=True)
    state = Column(Text, nullable=True)
    if HAS_GEO:
        boundary = Column(Geometry("MULTIPOLYGON", srid=4326), nullable=True)
    else:
        boundary = Column(Text, nullable=True)
    population = Column(Integer, nullable=True)

    source_type = Column(Text, nullable=False, default="SYNTHETIC")
    source = Column(Text, nullable=True)
    source_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

    project = relationship("SIHProject", back_populates="villages")
    parcels = relationship("SIHParcel", back_populates="village")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "village_id": self.village_id,
            "project_id": self.project_id,
            "name": self.name,
            "tehsil": self.tehsil,
            "district": self.district,
            "state": self.state,
            "population": self.population,
            "source_type": self.source_type,
            "source": self.source,
            "source_url": self.source_url,
        }


class SIHDepartment(SIHBase):
    __tablename__ = "departments"

    department_id = Column(Text, primary_key=True)
    name = Column(Text, nullable=False)
    jurisdiction = Column(Text, nullable=True)
    source_type = Column(Text, nullable=False, default="SYNTHETIC")

    officers = relationship("SIHOfficer", back_populates="department")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "department_id": self.department_id,
            "name": self.name,
            "jurisdiction": self.jurisdiction,
            "source_type": self.source_type,
        }


class SIHOfficer(SIHBase):
    __tablename__ = "officers"

    officer_id = Column(Text, primary_key=True)
    name = Column(Text, nullable=False)
    designation = Column(Text, nullable=True)
    department_id = Column(Text, ForeignKey("departments.department_id"), nullable=True)
    assigned_villages = Column(JSONB, nullable=True)
    source_type = Column(Text, nullable=False, default="SYNTHETIC")

    department = relationship("SIHDepartment", back_populates="officers")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "officer_id": self.officer_id,
            "name": self.name,
            "designation": self.designation,
            "department_id": self.department_id,
            "assigned_villages": self.assigned_villages,
            "source_type": self.source_type,
        }


class SIHOwner(SIHBase):
    __tablename__ = "owners"

    owner_id = Column(Text, primary_key=True)
    name = Column(Text, nullable=False)
    owner_type = Column(Text, nullable=True)  # individual | joint | institutional
    contact_village = Column(Text, nullable=True)
    source_type = Column(Text, nullable=False, default="SYNTHETIC")

    parcels = relationship("SIHParcel", back_populates="owner")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "owner_id": self.owner_id,
            "name": self.name,
            "owner_type": self.owner_type,
            "contact_village": self.contact_village,
            "source_type": self.source_type,
        }


class SIHParcel(SIHBase):
    __tablename__ = "parcels"

    parcel_id = Column(Text, primary_key=True)
    project_id = Column(Text, ForeignKey("projects.project_id"), nullable=True)
    village_id = Column(Text, ForeignKey("villages.village_id"), nullable=True)
    survey_number = Column(Text, nullable=False)
    if HAS_GEO:
        geometry = Column(Geometry("POLYGON", srid=4326), nullable=True)
    else:
        geometry = Column(Text, nullable=True)
    area_sqm = Column(Numeric, nullable=True)
    land_use = Column(Text, nullable=True)  # agricultural | residential | commercial | forest | barren
    acquisition_status = Column(Text, nullable=True)  # not_started | notified | award_declared | compensated | possessed
    owner_id = Column(Text, ForeignKey("owners.owner_id"), nullable=True)
    ownership_conflict = Column(Boolean, default=False)
    conflict_type = Column(Text, nullable=True)  # none | duplicate_claim | succession_dispute | boundary_dispute
    criticality_score = Column(Numeric, nullable=True)  # MODEL_DERIVED
    risk_score = Column(Numeric, nullable=True)  # MODEL_DERIVED
    is_hidden_critical = Column(Boolean, default=False)

    source_type = Column(Text, nullable=False, default="SYNTHETIC")
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

    project = relationship("SIHProject", back_populates="parcels")
    village = relationship("SIHVillage", back_populates="parcels")
    owner = relationship("SIHOwner", back_populates="parcels")
    cases = relationship("SIHAcquisitionCase", back_populates="parcel")
    documents = relationship("SIHDocument", back_populates="parcel")
    verifications = relationship("SIHVerification", back_populates="parcel")
    land_records = relationship("SIHLandRecord", back_populates="parcel")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "parcel_id": self.parcel_id,
            "project_id": self.project_id,
            "village_id": self.village_id,
            "survey_number": self.survey_number,
            "area_sqm": float(self.area_sqm) if self.area_sqm is not None else None,
            "land_use": self.land_use,
            "acquisition_status": self.acquisition_status,
            "owner_id": self.owner_id,
            "ownership_conflict": self.ownership_conflict,
            "conflict_type": self.conflict_type,
            "criticality_score": float(self.criticality_score) if self.criticality_score is not None else 0.0,
            "risk_score": float(self.risk_score) if self.risk_score is not None else 0.0,
            "is_hidden_critical": self.is_hidden_critical,
            "source_type": self.source_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class SIHLandRecord(SIHBase):
    __tablename__ = "land_records"

    record_id = Column(Text, primary_key=True)
    parcel_id = Column(Text, ForeignKey("parcels.parcel_id"), nullable=True)
    record_type = Column(Text, nullable=True)  # jamabandi | mutation | girdawari
    record_date = Column(Date, nullable=True)
    details_json = Column(JSONB, nullable=True)
    source_type = Column(Text, nullable=False, default="SYNTHETIC")

    parcel = relationship("SIHParcel", back_populates="land_records")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "record_id": self.record_id,
            "parcel_id": self.parcel_id,
            "record_type": self.record_type,
            "record_date": self.record_date.isoformat() if self.record_date else None,
            "details_json": self.details_json,
            "source_type": self.source_type,
        }


class SIHAcquisitionCase(SIHBase):
    __tablename__ = "acquisition_cases"

    case_id = Column(Text, primary_key=True)
    parcel_id = Column(Text, ForeignKey("parcels.parcel_id"), nullable=True)
    notification_date = Column(Date, nullable=True)
    declaration_date = Column(Date, nullable=True)
    award_date = Column(Date, nullable=True)
    possession_date = Column(Date, nullable=True)
    status = Column(Text, nullable=True)  # notified | declared | awarded | compensation_pending | possessed | disputed
    source_type = Column(Text, nullable=False, default="SYNTHETIC")

    parcel = relationship("SIHParcel", back_populates="cases")
    compensation_records = relationship("SIHCompensationRecord", back_populates="acquisition_case")
    rr_records = relationship("SIHRRRecord", back_populates="acquisition_case")
    legal_cases = relationship("SIHLegalCase", back_populates="acquisition_case")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "case_id": self.case_id,
            "parcel_id": self.parcel_id,
            "notification_date": self.notification_date.isoformat() if self.notification_date else None,
            "declaration_date": self.declaration_date.isoformat() if self.declaration_date else None,
            "award_date": self.award_date.isoformat() if self.award_date else None,
            "possession_date": self.possession_date.isoformat() if self.possession_date else None,
            "status": self.status,
            "source_type": self.source_type,
        }


class SIHCompensationRecord(SIHBase):
    __tablename__ = "compensation_records"

    compensation_id = Column(Text, primary_key=True)
    case_id = Column(Text, ForeignKey("acquisition_cases.case_id"), nullable=True)
    market_value_base = Column(Numeric, nullable=True)
    multiplier_factor = Column(Numeric, nullable=True)
    asset_value = Column(Numeric, nullable=True)
    severance_damage = Column(Numeric, nullable=True)
    subtotal_before_solatium = Column(Numeric, nullable=True)
    solatium_amount = Column(Numeric, nullable=True)
    interest_12pct_amount = Column(Numeric, nullable=True)
    total_compensation = Column(Numeric, nullable=True)
    compensation_status = Column(Text, nullable=True)  # pending | disbursed | disputed | enhanced_by_court
    source_type = Column(Text, nullable=False, default="MODEL_DERIVED")

    acquisition_case = relationship("SIHAcquisitionCase", back_populates="compensation_records")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "compensation_id": self.compensation_id,
            "case_id": self.case_id,
            "market_value_base": float(self.market_value_base) if self.market_value_base is not None else 0,
            "multiplier_factor": float(self.multiplier_factor) if self.multiplier_factor is not None else 1.0,
            "asset_value": float(self.asset_value) if self.asset_value is not None else 0,
            "severance_damage": float(self.severance_damage) if self.severance_damage is not None else 0,
            "subtotal_before_solatium": float(self.subtotal_before_solatium) if self.subtotal_before_solatium is not None else 0,
            "solatium_amount": float(self.solatium_amount) if self.solatium_amount is not None else 0,
            "interest_12pct_amount": float(self.interest_12pct_amount) if self.interest_12pct_amount is not None else 0,
            "total_compensation": float(self.total_compensation) if self.total_compensation is not None else 0,
            "compensation_status": self.compensation_status,
            "source_type": self.source_type,
        }


class SIHRRRecord(SIHBase):
    __tablename__ = "rr_records"

    rr_id = Column(Text, primary_key=True)
    case_id = Column(Text, ForeignKey("acquisition_cases.case_id"), nullable=True)
    family_type = Column(Text, nullable=True)  # titleholder | landless_labourer | tenant
    housing_entitlement = Column(Numeric, nullable=True)
    subsistence_allowance = Column(Numeric, nullable=True)
    transport_allowance = Column(Numeric, nullable=True)
    resettlement_allowance = Column(Numeric, nullable=True)
    livelihood_option = Column(Text, nullable=True)  # annuity | employment | one_time
    rr_status = Column(Text, nullable=True)  # not_applicable | pending | in_progress | completed
    source_type = Column(Text, nullable=False, default="SYNTHETIC")

    acquisition_case = relationship("SIHAcquisitionCase", back_populates="rr_records")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rr_id": self.rr_id,
            "case_id": self.case_id,
            "family_type": self.family_type,
            "housing_entitlement": float(self.housing_entitlement) if self.housing_entitlement is not None else 0,
            "subsistence_allowance": float(self.subsistence_allowance) if self.subsistence_allowance is not None else 0,
            "transport_allowance": float(self.transport_allowance) if self.transport_allowance is not None else 0,
            "resettlement_allowance": float(self.resettlement_allowance) if self.resettlement_allowance is not None else 0,
            "livelihood_option": self.livelihood_option,
            "rr_status": self.rr_status,
            "source_type": self.source_type,
        }


class SIHLegalCase(SIHBase):
    __tablename__ = "legal_cases"

    legal_case_id = Column(Text, primary_key=True)
    case_id = Column(Text, ForeignKey("acquisition_cases.case_id"), nullable=True)
    case_name = Column(Text, nullable=True)
    court = Column(Text, nullable=True)
    filed_date = Column(Date, nullable=True)
    legal_issue = Column(Text, nullable=True)
    legal_status = Column(Text, nullable=True)  # none | filed | in_hearing | stayed | decided_for_owner | decided_for_authority
    decision_notes = Column(Text, nullable=True)
    is_reference_case = Column(Boolean, default=False)
    source_type = Column(Text, nullable=False, default="SYNTHETIC")
    source = Column(Text, nullable=True)
    source_url = Column(Text, nullable=True)

    acquisition_case = relationship("SIHAcquisitionCase", back_populates="legal_cases")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "legal_case_id": self.legal_case_id,
            "case_id": self.case_id,
            "case_name": self.case_name,
            "court": self.court,
            "filed_date": self.filed_date.isoformat() if self.filed_date else None,
            "legal_issue": self.legal_issue,
            "legal_status": self.legal_status,
            "decision_notes": self.decision_notes,
            "is_reference_case": self.is_reference_case,
            "source_type": self.source_type,
            "source": self.source,
            "source_url": self.source_url,
        }


class SIHDocument(SIHBase):
    __tablename__ = "documents"

    document_id = Column(Text, primary_key=True)
    case_id = Column(Text, ForeignKey("acquisition_cases.case_id"), nullable=True)
    parcel_id = Column(Text, ForeignKey("parcels.parcel_id"), nullable=True)
    document_type = Column(Text, nullable=True)  # notification | award | title_deed | mutation_certificate | rr_entitlement_card
    upload_date = Column(Date, nullable=True)
    document_status = Column(Text, nullable=True)  # missing | submitted | under_verification | verified | rejected_inconsistent
    file_ref = Column(Text, nullable=True)
    extracted_fields = Column(JSONB, nullable=True)
    source_type = Column(Text, nullable=False, default="SYNTHETIC")

    parcel = relationship("SIHParcel", back_populates="documents")
    verifications = relationship("SIHVerification", back_populates="document")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "document_id": self.document_id,
            "case_id": self.case_id,
            "parcel_id": self.parcel_id,
            "document_type": self.document_type,
            "upload_date": self.upload_date.isoformat() if self.upload_date else None,
            "document_status": self.document_status,
            "file_ref": self.file_ref,
            "extracted_fields": self.extracted_fields,
            "source_type": self.source_type,
        }


class SIHVerification(SIHBase):
    __tablename__ = "verifications"

    verification_id = Column(Text, primary_key=True)
    document_id = Column(Text, ForeignKey("documents.document_id"), nullable=True)
    parcel_id = Column(Text, ForeignKey("parcels.parcel_id"), nullable=True)
    verification_type = Column(Text, nullable=True)  # ownership | document | field
    status = Column(Text, nullable=True)  # pending | verified | rejected
    officer_id = Column(Text, ForeignKey("officers.officer_id"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    source_type = Column(Text, nullable=False, default="SYNTHETIC")

    document = relationship("SIHDocument", back_populates="verifications")
    parcel = relationship("SIHParcel", back_populates="verifications")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "verification_id": self.verification_id,
            "document_id": self.document_id,
            "parcel_id": self.parcel_id,
            "verification_type": self.verification_type,
            "status": self.status,
            "officer_id": self.officer_id,
            "verified_at": self.verified_at.isoformat() if self.verified_at else None,
            "source_type": self.source_type,
        }


class SIHApproval(SIHBase):
    __tablename__ = "approvals"

    approval_id = Column(Text, primary_key=True)
    entity_type = Column(Text, nullable=True)  # compensation | rr | possession | notification
    entity_id = Column(Text, nullable=True)
    officer_id = Column(Text, ForeignKey("officers.officer_id"), nullable=True)
    department_id = Column(Text, ForeignKey("departments.department_id"), nullable=True)
    approval_status = Column(Text, nullable=True)  # pending | under_review | approved | rejected | escalated
    requested_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    source_type = Column(Text, nullable=False, default="SYNTHETIC")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "approval_id": self.approval_id,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "officer_id": self.officer_id,
            "department_id": self.department_id,
            "approval_status": self.approval_status,
            "requested_at": self.requested_at.isoformat() if self.requested_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "source_type": self.source_type,
        }


class SIHProjectSegment(SIHBase):
    __tablename__ = "project_segments"

    segment_id = Column(Text, primary_key=True)
    project_id = Column(Text, ForeignKey("projects.project_id"), nullable=True)
    name = Column(Text, nullable=True)
    if HAS_GEO:
        geometry = Column(Geometry("LINESTRING", srid=4326), nullable=True)
    else:
        geometry = Column(Text, nullable=True)
    chainage_start = Column(Numeric, nullable=True)
    chainage_end = Column(Numeric, nullable=True)
    status = Column(Text, nullable=True)
    source_type = Column(Text, nullable=False, default="SYNTHETIC")

    project = relationship("SIHProject", back_populates="segments")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "segment_id": self.segment_id,
            "project_id": self.project_id,
            "name": self.name,
            "chainage_start": float(self.chainage_start) if self.chainage_start is not None else 0,
            "chainage_end": float(self.chainage_end) if self.chainage_end is not None else 0,
            "status": self.status,
            "source_type": self.source_type,
        }


class SIHParcelSegmentMap(SIHBase):
    __tablename__ = "parcel_segment_map"

    parcel_id = Column(Text, ForeignKey("parcels.parcel_id"), primary_key=True)
    segment_id = Column(Text, ForeignKey("project_segments.segment_id"), primary_key=True)

    def to_dict(self) -> Dict[str, Any]:
        return {"parcel_id": self.parcel_id, "segment_id": self.segment_id}


class SIHMilestone(SIHBase):
    __tablename__ = "milestones"

    milestone_id = Column(Text, primary_key=True)
    project_id = Column(Text, ForeignKey("projects.project_id"), nullable=True)
    name = Column(Text, nullable=True)
    target_date = Column(Date, nullable=True)
    projected_date = Column(Numeric, nullable=True)  # MODEL_DERIVED offset / days
    status = Column(Text, nullable=True)
    source_type = Column(Text, nullable=False, default="SYNTHETIC")

    project = relationship("SIHProject", back_populates="milestones")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "milestone_id": self.milestone_id,
            "project_id": self.project_id,
            "name": self.name,
            "target_date": self.target_date.isoformat() if self.target_date else None,
            "projected_date": float(self.projected_date) if self.projected_date is not None else None,
            "status": self.status,
            "source_type": self.source_type,
        }


class SIHSegmentMilestoneMap(SIHBase):
    __tablename__ = "segment_milestone_map"

    segment_id = Column(Text, ForeignKey("project_segments.segment_id"), primary_key=True)
    milestone_id = Column(Text, ForeignKey("milestones.milestone_id"), primary_key=True)

    def to_dict(self) -> Dict[str, Any]:
        return {"segment_id": self.segment_id, "milestone_id": self.milestone_id}


class SIHDependencyEdge(SIHBase):
    __tablename__ = "dependency_edges"

    edge_id = Column(Integer, primary_key=True, autoincrement=True)
    from_node_type = Column(Text, nullable=False)
    from_node_id = Column(Text, nullable=False)
    to_node_type = Column(Text, nullable=False)
    to_node_id = Column(Text, nullable=False)
    edge_type = Column(Text, nullable=False)
    is_blocking = Column(Boolean, nullable=False, default=False)
    weight_days = Column(Numeric, nullable=True)
    source_type = Column(Text, nullable=False, default="SYNTHETIC")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "edge_id": self.edge_id,
            "from_node_type": self.from_node_type,
            "from_node_id": self.from_node_id,
            "to_node_type": self.to_node_type,
            "to_node_id": self.to_node_id,
            "edge_type": self.edge_type,
            "is_blocking": self.is_blocking,
            "weight_days": float(self.weight_days) if self.weight_days is not None else 0,
            "source_type": self.source_type,
        }


class SIHRoad(SIHBase):
    __tablename__ = "roads"

    road_id = Column(Text, primary_key=True)
    name = Column(Text, nullable=True)
    road_class = Column(Text, nullable=True)
    if HAS_GEO:
        geometry = Column(Geometry("LINESTRING", srid=4326), nullable=True)
    else:
        geometry = Column(Text, nullable=True)
    source_type = Column(Text, nullable=False, default="REAL_PUBLIC")
    source = Column(Text, default="OpenStreetMap via Geofabrik")
    source_url = Column(Text, default="https://download.geofabrik.de/asia/india.html")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "road_id": self.road_id,
            "name": self.name,
            "road_class": self.road_class,
            "source_type": self.source_type,
            "source": self.source,
            "source_url": self.source_url,
        }


class SIHInfrastructure(SIHBase):
    __tablename__ = "infrastructure"

    infra_id = Column(Text, primary_key=True)
    name = Column(Text, nullable=True)
    infra_type = Column(Text, nullable=True)
    if HAS_GEO:
        geometry = Column(Geometry("GEOMETRY", srid=4326), nullable=True)
    else:
        geometry = Column(Text, nullable=True)
    source_type = Column(Text, nullable=False, default="REAL_PUBLIC")
    source = Column(Text, nullable=True)
    source_url = Column(Text, nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "infra_id": self.infra_id,
            "name": self.name,
            "infra_type": self.infra_type,
            "source_type": self.source_type,
            "source": self.source,
            "source_url": self.source_url,
        }


class SIHAuditLog(SIHBase):
    __tablename__ = "audit_logs"

    log_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_type = Column(Text, nullable=False)
    entity_id = Column(Text, nullable=False)
    action = Column(Text, nullable=False)
    actor_id = Column(Text, nullable=True)
    before_value = Column(JSONB, nullable=True)
    after_value = Column(JSONB, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=func.now())
    source_type = Column(Text, nullable=False, default="USER_ENTERED")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "log_id": self.log_id,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "action": self.action,
            "actor_id": self.actor_id,
            "before_value": self.before_value,
            "after_value": self.after_value,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "source_type": self.source_type,
        }
