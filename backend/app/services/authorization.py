from uuid import UUID
from fastapi import HTTPException
from app.api.deps import TrustedIdentity

class AuthorizationService:
    @staticmethod
    def verify_project_access(user: TrustedIdentity, project_id: str):
        """
        Validates if the user has RBAC + Object-Level access to the Project.
        Default behavior must be DENY.
        """
        if user.role == "ADMIN":
            return True
            
        if user.role in ["DISTRICT_OFFICER", "VIEWER"]:
            if user.assigned_project_id and user.assigned_project_id == str(project_id):
                return True
            
        # Default deny
        raise HTTPException(status_code=403, detail="Forbidden: Insufficient project privileges")
        
    @staticmethod
    def verify_mutation_access(user: TrustedIdentity):
        if user.role not in ["ADMIN", "DISTRICT_OFFICER"]:
            raise HTTPException(status_code=403, detail="Forbidden: Mutation requires elevated role")
