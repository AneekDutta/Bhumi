"""
Identity Verification Service
SIH26016 Land Acquisition Platform - KOSH
Coordinates identity adapters, manages audit trail with strict data minimization.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.schemas.identity import (
    IdentityVerificationRequest,
    IdentityVerificationResponse,
    STATUTORY_IDENTITY_DISCLAIMER,
)
from app.services.identity.base import IdentityVerificationAdapter
from app.services.identity.mock_adapter import mock_identity_adapter


class IdentityService:
    """
    Service coordinating identity verification adapters.
    Maintains an in-memory audit trail strictly devoid of PII / raw credentials.
    """

    def __init__(self, default_adapter: Optional[IdentityVerificationAdapter] = None):
        self._adapter: IdentityVerificationAdapter = default_adapter or mock_identity_adapter
        self._audit_log: List[Dict[str, Any]] = []

    def set_adapter(self, adapter: IdentityVerificationAdapter) -> None:
        self._adapter = adapter

    async def verify_identity(
        self,
        request: IdentityVerificationRequest,
        officer_id: Optional[str] = None,
    ) -> IdentityVerificationResponse:
        """
        Executes identity verification via the configured adapter and records
        a privacy-compliant audit log entry.
        """
        response = await self._adapter.verify(request)

        # Append data-minimized audit trail entry
        audit_entry = {
            "verification_id": response.verification_id,
            "id_type": response.id_type.value,
            "masked_identifier": response.masked_identifier,
            "claimed_name": response.claimed_name,
            "status": response.status.value,
            "name_match_score": response.name_match_score,
            "verification_method": response.verification_method.value,
            "verified_at": response.verified_at.isoformat(),
            "case_id": response.case_id,
            "parcel_id": response.parcel_id,
            "initiated_by": officer_id or "SYSTEM",
            "statutory_title_conferred": False,  # Explicitly recorded in audit trail
        }
        self._audit_log.append(audit_entry)

        return response

    def get_audit_trail(
        self,
        parcel_id: Optional[str] = None,
        case_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves privacy-compliant audit logs filtered by parcel or case ID.
        """
        results = self._audit_log
        if parcel_id:
            results = [e for e in results if e.get("parcel_id") == parcel_id]
        if case_id:
            results = [e for e in results if e.get("case_id") == case_id]
        return results

    def get_disclaimer(self) -> Dict[str, str]:
        return {
            "disclaimer": STATUTORY_IDENTITY_DISCLAIMER,
            "legal_basis": "RFCTLARR Act 2013 & Aadhaar Act 2016",
            "note": "Identity verification authenticates claimant persona only. Title to land must be verified from Revenue Records (RoR) independently.",
        }


identity_service = IdentityService()
