import os
from fastapi import HTTPException, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

security = HTTPBearer(auto_error=False)

class TrustedIdentity(BaseModel):
    user_id: str
    role: str
    assigned_project_id: str = None
    assigned_district_id: str = None

def get_current_user_context(
    request: Request,
    auth: HTTPAuthorizationCredentials = Security(security)
) -> TrustedIdentity:
    auth_mode = os.getenv("AUTH_MODE", "mock")
    
    if auth_mode == "prod":
        # Any attempt to pass mock headers in prod is strictly ignored/rejected
        if request.headers.get("x-mock-role") or request.headers.get("x-mock-project-id"):
            raise HTTPException(status_code=403, detail="Mock headers forbidden in production")
            
        if not auth:
            raise HTTPException(status_code=401, detail="Missing authentication token")
        raise HTTPException(status_code=501, detail="Prod auth requires production configuration")
        
    mock_role = request.headers.get("x-mock-role", "ADMIN")
    mock_pid = request.headers.get("x-mock-project-id", "test-project-123")
    return TrustedIdentity(user_id="dev-admin-123", role=mock_role, assigned_project_id=mock_pid)
