"""
Mock Identity Verification Adapter
SIH26016 Land Acquisition Platform - KOSH
Simulates UIDAI / DigiLocker / NSDL Demographics and OTP Matching
Strict Data Minimization & Statutory Disclaimer Enforced
"""
from datetime import datetime, timezone
import difflib
import uuid
from typing import Dict

from app.schemas.identity import (
    IdentityType,
    IdentityVerificationRequest,
    IdentityVerificationResponse,
    STATUTORY_IDENTITY_DISCLAIMER,
    VerificationMethod,
    VerificationStatus,
)
from app.services.identity.base import IdentityVerificationAdapter

# Mock official registry records for simulated verification
MOCK_OFFICIAL_REGISTRY: Dict[str, Dict[str, str]] = {
    "XXXX-XXXX-1234": {
        "official_name": "Ramesh Chandra",
        "dob_or_yob": "1968",
        "gender": "M",
        "valid_otp": "123456",
    },
    "XXXX-XXXX-5678": {
        "official_name": "Sunita Devi",
        "dob_or_yob": "1975",
        "gender": "F",
        "valid_otp": "654321",
    },
    "XXXX-XXXX-9999": {
        "official_name": "Ram Charan",
        "dob_or_yob": "1960",
        "gender": "M",
        "valid_otp": "111111",
    },
    "ABCDE1234F": {
        "official_name": "Ramesh Chandra",
        "dob_or_yob": "1968",
        "gender": "M",
    },
    "XYZPK9876Q": {
        "official_name": "Sunita Devi",
        "dob_or_yob": "1975",
        "gender": "F",
    },
}


class MockIdentityAdapter(IdentityVerificationAdapter):
    """
    In-memory mock adapter for deterministic identity verification.
    Guarantees:
    1. Rejects requests lacking explicit statutory consent.
    2. Enforces data minimization: OTP and raw identifiers are never stored.
    3. Strictly outputs the statutory disclaimer that identity does not equal title.
    """

    async def verify(self, request: IdentityVerificationRequest) -> IdentityVerificationResponse:
        now = datetime.now(timezone.utc)
        vid = f"IDV-{uuid.uuid4().hex[:8].upper()}"

        # 1. Enforce statutory consent
        if not request.consent_given:
            return IdentityVerificationResponse(
                verification_id=vid,
                status=VerificationStatus.CONSENT_REJECTED,
                id_type=request.id_type,
                masked_identifier=request.identifier,
                claimed_name=request.claimed_name,
                name_match_score=0.0,
                verification_method=VerificationMethod.DEMOGRAPHIC_MATCH,
                verified_at=now,
                case_id=request.case_id,
                parcel_id=request.parcel_id,
                disclaimer=STATUTORY_IDENTITY_DISCLAIMER,
                details={"reason": "Consent explicitly declined or not provided."},
            )

        # 2. Check mock record
        official_record = MOCK_OFFICIAL_REGISTRY.get(request.identifier)
        if not official_record:
            # Fallback fuzzy match against claimed name
            clean_claimed = request.claimed_name.strip().title()
            best_match_name = None
            best_ratio = 0.0

            for rec in MOCK_OFFICIAL_REGISTRY.values():
                ratio = difflib.SequenceMatcher(None, clean_claimed.lower(), rec["official_name"].lower()).ratio()
                if ratio > best_ratio:
                    best_ratio = ratio
                    best_match_name = rec["official_name"]

            # If no direct match in mock registry, simulate general demographic match
            match_score = round(best_ratio if best_ratio > 0.6 else 0.85, 2)
            matched_name = best_match_name or clean_claimed
            status = VerificationStatus.SUCCESS if match_score >= 0.70 else VerificationStatus.FAILED

            return IdentityVerificationResponse(
                verification_id=vid,
                status=status,
                id_type=request.id_type,
                masked_identifier=request.identifier,
                claimed_name=request.claimed_name,
                matched_name=matched_name,
                name_match_score=match_score,
                verification_method=VerificationMethod.DEMOGRAPHIC_MATCH,
                verified_at=now,
                case_id=request.case_id,
                parcel_id=request.parcel_id,
                disclaimer=STATUTORY_IDENTITY_DISCLAIMER,
                details={"match_type": "simulated_demographic_registry"},
            )

        # 3. If official record found
        official_name = official_record["official_name"]
        ratio = difflib.SequenceMatcher(
            None,
            request.claimed_name.strip().lower(),
            official_name.strip().lower()
        ).ratio()
        name_score = round(ratio, 2)

        # OTP check if requested
        method = VerificationMethod.DEMOGRAPHIC_MATCH
        status = VerificationStatus.SUCCESS if name_score >= 0.70 else VerificationStatus.FAILED

        if request.otp is not None:
            method = VerificationMethod.OTP_VERIFICATION
            expected_otp = official_record.get("valid_otp", "123456")
            if request.otp != expected_otp:
                status = VerificationStatus.FAILED

        return IdentityVerificationResponse(
            verification_id=vid,
            status=status,
            id_type=request.id_type,
            masked_identifier=request.identifier,
            claimed_name=request.claimed_name,
            matched_name=official_name,
            name_match_score=name_score,
            verification_method=method,
            verified_at=now,
            case_id=request.case_id,
            parcel_id=request.parcel_id,
            disclaimer=STATUTORY_IDENTITY_DISCLAIMER,
            details={
                "registry_hit": True,
                "dob_verified": request.dob_or_yob == official_record.get("dob_or_yob"),
            },
        )


mock_identity_adapter = MockIdentityAdapter()
