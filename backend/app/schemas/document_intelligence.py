"""
Pydantic Schemas for KOSH Document Intelligence & OCR Pipeline
SIH26016 Land Acquisition Digital Twin Platform

Strictly enforces:
- OCR Layout & Field-level Confidence
- Schema-specific Extraction
- Human Review Gate (EXTRACTED -> PENDING_REVIEW -> VERIFIED)
- Untrusted Document Input Defense
"""
from datetime import date, datetime
from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field, model_validator


class DocumentCategory(str, Enum):
    SECTION_11_NOTIFICATION = "SECTION_11_NOTIFICATION"
    SECTION_19_DECLARATION = "SECTION_19_DECLARATION"
    SECTION_21_NOTICE = "SECTION_21_NOTICE"
    AWARD_STATEMENT = "AWARD_STATEMENT"
    PAYMENT_PROOF = "PAYMENT_PROOF"
    RR_ENTITLEMENT = "RR_ENTITLEMENT"
    POSSESSION_PANCHNAMA = "POSSESSION_PANCHNAMA"
    FIELD_VERIFICATION_REPORT = "FIELD_VERIFICATION_REPORT"
    JAMABANDI_REVENUE_RECORD = "JAMABANDI_REVENUE_RECORD"
    SALE_DEED = "SALE_DEED"
    COMPLAINT_GRIEVANCE = "COMPLAINT_GRIEVANCE"
    COURT_STAY_ORDER = "COURT_STAY_ORDER"
    OTHER = "OTHER"


class ReviewStatus(str, Enum):
    EXTRACTED = "EXTRACTED"
    PENDING_REVIEW = "PENDING_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class JobStatus(str, Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class BoundingBox(BaseModel):
    ymin: float = Field(..., ge=0.0, le=1.0)
    xmin: float = Field(..., ge=0.0, le=1.0)
    ymax: float = Field(..., ge=0.0, le=1.0)
    xmax: float = Field(..., ge=0.0, le=1.0)
    page_number: int = 1


class OCRBlock(BaseModel):
    text: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    bbox: Optional[BoundingBox] = None
    language: str = "en"


class OCRPage(BaseModel):
    page_number: int
    width: float
    height: float
    text: str
    blocks: list[OCRBlock] = []


class OCROutput(BaseModel):
    document_hash: str
    provider: str
    model_version: str
    pages: list[OCRPage] = []
    full_text: str
    average_confidence: float
    processing_timestamp: str


class ExtractedFieldItem(BaseModel):
    field_name: str
    label: str
    raw_value: Any
    normalized_value: Any
    confidence: float = Field(..., ge=0.0, le=1.0)
    confidence_score: Optional[float] = None
    field_label: Optional[str] = None
    extracted_value: Optional[Any] = None
    source_page: int = 1
    bbox: Optional[BoundingBox] = None
    validation_status: str = "PROPOSED"  # PROPOSED | ACCEPTED | MODIFIED | REJECTED
    validation_notes: Optional[str] = None
    verified_value: Optional[Any] = None

    @model_validator(mode="after")
    def populate_aliases(self):
        if self.confidence_score is None:
            self.confidence_score = self.confidence
        if self.field_label is None:
            self.field_label = self.label
        if self.extracted_value is None:
            self.extracted_value = self.normalized_value if self.normalized_value is not None else self.raw_value
        return self


# Specific Extraction Payload Schemas
class Section11Extraction(BaseModel):
    notification_number: str
    notification_date: str
    project_name: str
    district: str
    tehsil: str
    villages: list[str] = []
    survey_numbers: list[str] = []
    total_area_hectares: Optional[float] = None
    public_purpose: str
    statutory_section: str = "Section 11(1)"


class Section19Extraction(BaseModel):
    declaration_number: str
    declaration_date: str
    notification_reference: Optional[str] = None
    project_name: str
    villages: list[str] = []
    survey_numbers: list[str] = []
    total_area_hectares: Optional[float] = None
    statutory_section: str = "Section 19(1)"


class AwardExtraction(BaseModel):
    award_number: str
    award_date: str
    parcel_id: Optional[str] = None
    survey_number: str
    landowner_name: str
    land_area_hectares: float
    market_value: float
    multiplier_factor: float
    base_compensation: float
    assets_value: float = 0.0
    solatium_amount: float
    additional_interest_sec30_3: float = 0.0
    total_award_amount: float
    is_arithmetic_valid: bool = True
    statutory_section: str = "Section 23/25"


class CourtStayExtraction(BaseModel):
    court_name: str
    case_number: str
    order_date: str
    petitioner_name: str
    respondent_name: str
    stay_vacated_date: Optional[str] = None
    stay_scope: str
    stay_days_indicated: Optional[int] = None
    is_interim_stay: bool = True


class SaleDeedExtraction(BaseModel):
    deed_number: str
    registration_date: str
    sub_registrar_office: str
    village: str
    survey_number: str
    area_hectares: float
    transaction_amount: float
    rate_per_hectare: float
    land_type: str = "AGRICULTURAL"
    is_candidate_comparable: bool = True


class DocumentExtractionDetail(BaseModel):
    document_id: str
    filename: str
    document_category: DocumentCategory
    sha256_hash: str
    document_hash: Optional[str] = None
    uploaded_at: str
    review_status: ReviewStatus
    extraction_status: str = "PENDING_REVIEW"
    ocr_provider: str
    ocr_engine: Optional[str] = "2"
    ocr_source: Optional[str] = "External OCR"
    ocr_status: Optional[str] = "OCR_COMPLETE"
    ocr_confidence: float
    raw_text: Optional[str] = None
    extracted_fields: list[ExtractedFieldItem] = []
    structured_data: dict[str, Any] = {}
    validation_errors: list[str] = []
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    review_notes: Optional[str] = None


class FieldReviewUpdate(BaseModel):
    field_name: str
    verified_value: Any
    status: str = "ACCEPTED"  # ACCEPTED | MODIFIED | REJECTED
    notes: Optional[str] = None


class DocumentReviewUpdateRequest(BaseModel):
    field_updates: list[FieldReviewUpdate] = []
    review_notes: Optional[str] = None
    mark_verified: bool = False


class ApplyExtractionRequest(BaseModel):
    case_id: Optional[str] = None
    parcel_id: Optional[str] = None
    project_id: Optional[str] = None
    link_statutory_deadlines: bool = True


class DocumentJobRead(BaseModel):
    job_id: str
    document_id: str
    document_hash: Optional[str] = None
    filename: str
    category: DocumentCategory
    status: JobStatus
    created_at: str
    completed_at: Optional[str] = None
    error_message: Optional[str] = None

