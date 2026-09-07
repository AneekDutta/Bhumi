"""
Identity Verification Schemas
SIH26016 Land Acquisition Platform - KOSH
Strict Data Minimization & Statutory Title Disclaimer Enforced
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, Optional
import re
from pydantic import BaseModel, Field, field_validator

STATUTORY_IDENTITY_DISCLAIMER: str = (
    "IDENTITY VERIFICATION DOES NOT CONFER, PROVE, OR MODIFY LAND OWNERSHIP OR TITLE. "
    "Proof of identity establishes individual persona only. Land title must be established "
    "independently through verified revenue records (Record of Rights / Jamabandi), "
    "registered sale deeds, or quasi-judicial determination under the RFCTLARR Act 2013."
)


class IdentityType(str, Enum):
    AADHAAR = "AADHAAR"
    PAN = "PAN"
    VOTER_ID = "VOTER_ID"
    PASSPORT = "PASSPORT"


class VerificationMethod(str, Enum):
    DEMOGRAPHIC_MATCH = "DEMOGRAPHIC_MATCH"
    OTP_VERIFICATION = "OTP_VERIFICATION"
    DOCUMENT_VERIFICATION = "DOCUMENT_VERIFICATION"


class VerificationStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    CONSENT_REJECTED = "CONSENT_REJECTED"
    INVALID_IDENTIFIER = "INVALID_IDENTIFIER"


class IdentityVerificationRequest(BaseModel):
    id_type: IdentityType = Field(..., description="Identity document type")
    identifier: str = Field(..., description="Masked identifier e.g. XXXX-XXXX-1234 or PAN ABCDE1234F")
    claimed_name: str = Field(..., min_length=2, max_length=150, description="Full name of the claimant")
    dob_or_yob: Optional[str] = Field(None, description="Date or year of birth (YYYY-MM-DD or YYYY)")
    gender: Optional[str] = Field(None, description="Gender (M/F/O)")

    # Consent is mandatory under Aadhaar Act & DPDP Act 2023
    consent_given: bool = Field(..., description="Must explicitly be True. Processing without consent is rejected.")
    consent_purpose: str = Field(
        ...,
        min_length=10,
        description="Statutory purpose for identity verification (e.g., 'Land acquisition compensation disbursal verification')"
    )
    consent_timestamp: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

    otp: Optional[str] = Field(None, description="One-time password for OTP verification. Never persisted.")
    case_id: Optional[str] = Field(None, description="Associated acquisition case ID")
    parcel_id: Optional[str] = Field(None, description="Associated parcel ID")

    @field_validator("identifier")
    @classmethod
    def validate_identifier(cls, v: str) -> str:
        clean = v.strip()
        # Strictly reject raw 12-digit Aadhaar number to enforce data minimization
        if re.match(r"^\d{12}$", clean):
            raise ValueError(
                "Raw 12-digit Aadhaar number rejected under strict data minimization policy. "
                "Provide masked identifier in format 'XXXX-XXXX-1234' or last 4 digits only."
            )
        return clean

    @field_validator("consent_given")
    @classmethod
    def validate_consent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Identity verification rejected: Explicit consent is mandatory under DPDP Act 2023.")
        return v


class IdentityVerificationResponse(BaseModel):
    verification_id: str
    status: VerificationStatus
    id_type: IdentityType
    masked_identifier: str
    claimed_name: str
    matched_name: Optional[str] = None
    name_match_score: float = Field(..., ge=0.0, le=1.0, description="Fuzzy match confidence between 0.0 and 1.0")
    verification_method: VerificationMethod
    verified_at: datetime
    case_id: Optional[str] = None
    parcel_id: Optional[str] = None
    disclaimer: str = STATUTORY_IDENTITY_DISCLAIMER
    data_minimization_audit: Dict[str, Any] = Field(
        default_factory=lambda: {
            "raw_aadhaar_stored": False,
            "biometrics_stored": False,
            "otp_persisted": False,
            "statutory_title_conferred": False,
        }
    )
    details: Dict[str, Any] = Field(default_factory=dict)
