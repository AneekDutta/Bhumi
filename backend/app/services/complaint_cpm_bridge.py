"""
Complaint to CPM Dependency Engine Bridge
SIH26016 Digital Twin Integration Service

Authoritative Link:
Citizen Complaint (PostgreSQL)
    ↓
Spatial/Cadastral Parcel Normalization (P003 -> P00003)
    ↓
Authoritative Dependency Graph Storage (PostgreSQL dependency_edges)
    ↓
NetworkX CPM Recalculation (Derived Computation Layer)
    ↓
Zero-Float Critical Path & Project Delay Propagation
    ↓
GIS Cadastral Layer (Crimson Polygon Styling) & What-If Simulation
"""
import json
import logging
import uuid
from typing import Any, Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.sih26016_service import sih_service

logger = logging.getLogger("complaint_cpm_bridge")


def normalize_parcel_id(pid: Optional[str]) -> str:
    """
    Normalizes parcel IDs across varying formats:
    'P003' -> 'P00003'
    '3' -> 'P00003'
    'P-00003' -> 'P00003'
    'P00003' -> 'P00003'
    """
    if not pid:
        return ""
    pid_str = str(pid).strip().upper()
    digits = "".join([c for c in pid_str if c.isdigit()])
    if digits:
        return f"P{int(digits):05d}"
    return pid_str


def classify_complaint(complaint_type: str, priority: str = "NORMAL") -> dict[str, Any]:
    """
    Classifies a grievance into impact-bearing vs informational.
    Impact-bearing categories consume float and activate critical-path bottlenecks.
    """
    ctype = (complaint_type or "").strip().lower()
    prio = (priority or "NORMAL").strip().upper()

    # Impact-bearing categories
    if any(k in ctype for k in ["title", "ownership", "heir", "contest", "claim"]):
        return {
            "is_impact_bearing": True,
            "category_code": "TITLE_DISPUTE",
            "conflict_type": "ownership_dispute",
            "default_weight_days": 45.0,
            "auto_activate": prio in ["CRITICAL", "HIGH"]
        }
    if any(k in ctype for k in ["boundary", "measurement", "demarcation", "survey", "mismatch", "encroachment"]):
        return {
            "is_impact_bearing": True,
            "category_code": "BOUNDARY_MISMATCH",
            "conflict_type": "boundary_dispute",
            "default_weight_days": 35.0,
            "auto_activate": prio in ["CRITICAL", "HIGH"]
        }
    if any(k in ctype for k in ["possession", "physical", "unauthorized", "trespass", "eviction"]):
        return {
            "is_impact_bearing": True,
            "category_code": "PHYSICAL_POSSESSION",
            "conflict_type": "possession_dispute",
            "default_weight_days": 60.0,
            "auto_activate": prio in ["CRITICAL", "HIGH"]
        }
    if any(k in ctype for k in ["compensation", "award", "payment", "bank", "disbursement", "pfms"]):
        return {
            "is_impact_bearing": True,
            "category_code": "COMPENSATION_DELAY",
            "conflict_type": "compensation_delayed",
            "default_weight_days": 40.0,
            "auto_activate": prio in ["CRITICAL", "HIGH"]
        }
    if any(k in ctype for k in ["r&r", "resettlement", "rehabilitation", "entitlement"]):
        return {
            "is_impact_bearing": True,
            "category_code": "RR_ENTITLEMENT",
            "conflict_type": "rr_dispute",
            "default_weight_days": 30.0,
            "auto_activate": prio in ["CRITICAL", "HIGH"]
        }
    if any(k in ctype for k in ["valuation", "tree", "structure", "crop", "borewell"]):
        return {
            "is_impact_bearing": True,
            "category_code": "VALUATION_DISCREPANCY",
            "conflict_type": "valuation_discrepancy",
            "default_weight_days": 25.0,
            "auto_activate": prio in ["CRITICAL", "HIGH"]
        }

    # Informational categories (e.g. document copy, general query)
    return {
        "is_impact_bearing": False,
        "category_code": "INFORMATIONAL",
        "conflict_type": "none",
        "default_weight_days": 0.0,
        "auto_activate": False
    }


async def activate_complaint_blocker(
    db: AsyncSession,
    complaint_id: str,
    raw_parcel_id: str,
    complaint_type: str,
    priority: str = "NORMAL",
    notes: Optional[str] = None,
    actor_id: str = "SYSTEM",
    actor_role: str = "SYSTEM"
) -> dict[str, Any]:
    """
    Activates a persistent blocking dependency edge in PostgreSQL.
    Also activates the parcel's gating edge to its downstream project segment.
    Recalculates the derived CPM schedule.
    """
    norm_pid = normalize_parcel_id(raw_parcel_id)
    classification = classify_complaint(complaint_type, priority)

    if not classification["is_impact_bearing"]:
        logger.info(f"Complaint {complaint_id} is informational; no CPM blocker activated.")
        return {
            "success": True,
            "blocked": False,
            "reason": "informational_complaint",
            "parcel_id": norm_pid
        }

    weight_days = classification["default_weight_days"]
    conflict_type = classification["conflict_type"]

    try:
        # 1. Check if complaint edge already exists in PostgreSQL
        check_query = text("""
            SELECT edge_id FROM dependency_edges
            WHERE from_node_type = 'complaint' AND from_node_id = :complaint_id
        """)
        res = await db.execute(check_query, {"complaint_id": str(complaint_id)})
        existing = res.first()

        if existing:
            update_edge = text("""
                UPDATE dependency_edges
                SET is_blocking = TRUE,
                    weight_days = :weight_days,
                    to_node_type = 'parcel',
                    to_node_id = :parcel_id,
                    edge_type = 'blocks',
                    source_type = 'USER_ENTERED'
                WHERE edge_id = :edge_id
            """)
            await db.execute(update_edge, {
                "edge_id": existing[0],
                "weight_days": weight_days,
                "parcel_id": norm_pid
            })
        else:
            insert_edge = text("""
                INSERT INTO dependency_edges
                (from_node_type, from_node_id, to_node_type, to_node_id, edge_type, is_blocking, weight_days, source_type)
                VALUES ('complaint', :complaint_id, 'parcel', :parcel_id, 'blocks', TRUE, :weight_days, 'USER_ENTERED')
            """)
            await db.execute(insert_edge, {
                "complaint_id": str(complaint_id),
                "parcel_id": norm_pid,
                "weight_days": weight_days
            })

        # 2. Gate the downstream project segment for this parcel in dependency_edges
        gate_segment = text("""
            UPDATE dependency_edges
            SET is_blocking = TRUE
            WHERE from_node_type = 'parcel'
              AND from_node_id = :parcel_id
              AND to_node_type = 'project_segment'
        """)
        await db.execute(gate_segment, {"parcel_id": norm_pid})

        # 3. Audit Log
        audit_query = text("""
            INSERT INTO audit_logs (id, actor_id, actor_role, action, entity_type, entity_id, state_after, created_at, updated_at)
            VALUES (:id, :actor_id, :actor_role, 'DEPENDENCY_EDGE_ACTIVATED', 'DEPENDENCY_EDGE', :entity_id, :state, now(), now())
        """)
        await db.execute(audit_query, {
            "id": uuid.uuid4(),
            "actor_id": str(actor_id),
            "actor_role": str(actor_role),
            "entity_id": uuid.uuid4(),
            "state": json.dumps({
                "complaint_id": complaint_id,
                "parcel_id": norm_pid,
                "weight_days": weight_days,
                "conflict_type": conflict_type,
                "notes": notes
            })
        })

        await db.commit()

        # 5. Synchronize authoritative PostgreSQL state to derived NetworkX CPM engine
        await sih_service.sync_with_db(db)

        cpm_report = sih_service.get_critical_path_report()
        return {
            "success": True,
            "blocked": True,
            "parcel_id": norm_pid,
            "weight_days": weight_days,
            "conflict_type": conflict_type,
            "project_delay_days": cpm_report.get("project_delay_days"),
            "critical_path_nodes": cpm_report.get("critical_path_nodes", [])
        }

    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to activate complaint blocker: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "parcel_id": norm_pid
        }


async def deactivate_complaint_blocker(
    db: AsyncSession,
    complaint_id: str,
    raw_parcel_id: Optional[str] = None,
    notes: Optional[str] = None,
    actor_id: str = "SYSTEM",
    actor_role: str = "ADMIN"
) -> dict[str, Any]:
    """
    Deactivates a complaint blocker in PostgreSQL upon resolution/rejection.
    If no other active blockers remain for this parcel, unblocks the parcel's corridor segment.
    Recalculates the derived CPM schedule.
    """
    norm_pid = normalize_parcel_id(raw_parcel_id) if raw_parcel_id else ""

    try:
        # If parcel_id was not passed, discover it from the dependency_edges table
        if not norm_pid:
            lookup = text("""
                SELECT to_node_id FROM dependency_edges
                WHERE from_node_type = 'complaint' AND from_node_id = :complaint_id
            """)
            res = await db.execute(lookup, {"complaint_id": str(complaint_id)})
            row = res.first()
            if row:
                norm_pid = row[0]

        # 1. Deactivate the complaint blocking edge
        deactivate_edge = text("""
            UPDATE dependency_edges
            SET is_blocking = FALSE,
                weight_days = 0.0
            WHERE from_node_type = 'complaint' AND from_node_id = :complaint_id
        """)
        await db.execute(deactivate_edge, {"complaint_id": str(complaint_id)})

        # 2. Check if any OTHER active blocking edges remain on this parcel
        remaining_check = text("""
            SELECT count(*) FROM dependency_edges
            WHERE to_node_type = 'parcel'
              AND to_node_id = :parcel_id
              AND is_blocking = TRUE
        """)
        res_remaining = await db.execute(remaining_check, {"parcel_id": norm_pid})
        remaining_count = res_remaining.scalar() or 0

        unblocked_corridor = False
        if remaining_count == 0 and norm_pid:
            # Unblock the parcel -> project_segment edge
            unblock_segment = text("""
                UPDATE dependency_edges
                SET is_blocking = FALSE
                WHERE from_node_type = 'parcel'
                  AND from_node_id = :parcel_id
                  AND to_node_type = 'project_segment'
            """)
            await db.execute(unblock_segment, {"parcel_id": norm_pid})
            unblocked_corridor = True

        # 3. Audit Log
        audit_query = text("""
            INSERT INTO audit_logs (id, actor_id, actor_role, action, entity_type, entity_id, state_after, created_at, updated_at)
            VALUES (:id, :actor_id, :actor_role, 'DEPENDENCY_EDGE_DEACTIVATED', 'DEPENDENCY_EDGE', :entity_id, :state, now(), now())
        """)
        await db.execute(audit_query, {
            "id": uuid.uuid4(),
            "actor_id": str(actor_id),
            "actor_role": str(actor_role),
            "entity_id": uuid.uuid4(),
            "state": json.dumps({
                "complaint_id": complaint_id,
                "parcel_id": norm_pid,
                "remaining_blockers": remaining_count,
                "unblocked_corridor": unblocked_corridor,
                "notes": notes
            })
        })

        await db.commit()

        # 4. Synchronize authoritative PostgreSQL state to derived NetworkX CPM engine
        await sih_service.sync_with_db(db)

        cpm_report = sih_service.get_critical_path_report()
        return {
            "success": True,
            "unblocked": True,
            "parcel_id": norm_pid,
            "remaining_blockers": remaining_count,
            "unblocked_corridor": unblocked_corridor,
            "project_delay_days": cpm_report.get("project_delay_days"),
            "critical_path_nodes": cpm_report.get("critical_path_nodes", [])
        }

    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to deactivate complaint blocker: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "parcel_id": norm_pid
        }
