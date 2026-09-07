"""
Abstract Base Adapter for Identity Verification
Enforces adapter pattern for UIDAI, DigiLocker, PAN, and Voter ID providers.
"""
from abc import ABC, abstractmethod
from app.schemas.identity import IdentityVerificationRequest, IdentityVerificationResponse


class IdentityVerificationAdapter(ABC):
    """
    Abstract interface for identity verification providers.
    Implementations must strictly enforce data minimization:
    - Never log or store raw Aadhaar numbers or biometrics
    - Always verify applicant consent
    - Include the statutory ownership disclaimer
    """

    @abstractmethod
    async def verify(self, request: IdentityVerificationRequest) -> IdentityVerificationResponse:
        """
        Verify the identity of a claimant/landowner against provider API or mock records.
        """
        pass
