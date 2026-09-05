import logging
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import TrustedIdentity
from app.models.domain import Parcel, Project, Village

logger = logging.getLogger(__name__)

class AuthorizationService:
    @staticmethod
    async def verify_project_access(user: TrustedIdentity, project_id: str, db: AsyncSession):
        """
        Validates if the user has RBAC + Object-Level access to the Project.
        """
        # If user has a project scope, restrict them to that project
        if user.assigned_project_id:
            if user.assigned_project_id != str(project_id):
                raise HTTPException(status_code=403, detail="Forbidden: Insufficient project privileges")
            return True

        # If user has a district scope, restrict them to projects in that district
        if user.assigned_district_id:
            query = select(Project.id).join(Parcel, Parcel.project_id == Project.id)\
                                      .join(Village, Village.id == Parcel.village_id)\
                                      .where(Project.id == UUID(project_id))\
                                      .where(Village.district_id == UUID(user.assigned_district_id))\
                                      .limit(1)
            result = await db.execute(query)
            if not result.scalars().first():
                raise HTTPException(status_code=403, detail="Forbidden: Insufficient project privileges")
            return True

        # If user has NO scope
        if user.role == "ADMIN":
            return True # ADMIN no scope -> unrestricted

        # OFFICER / restricted user no scope -> 403
        raise HTTPException(status_code=403, detail="Forbidden: Insufficient project privileges")

    @staticmethod
    def verify_mutation_access(user: TrustedIdentity):
        if user.role not in ["ADMIN", "DISTRICT_OFFICER"]:
            raise HTTPException(status_code=403, detail="Forbidden: Mutation requires elevated role")
