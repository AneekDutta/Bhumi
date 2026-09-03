import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import AuditLog


async def log_transition(
    db: AsyncSession, 
    entity_type: str, 
    entity_id: uuid.UUID,
    action: str, 
    actor_id: str,
    actor_role: str,
    state_before: dict[str, Any], 
    state_after: dict[str, Any],
    source: str = "API"
):
    log_entry = AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        actor_id=actor_id,
        actor_role=actor_role,
        state_before=state_before,
        state_after=state_after,
        source=source
    )
    db.add(log_entry)
    # The caller is responsible for committing the transaction.
