"""
Seed script for Statutory Deadline Rules in Supabase PostgreSQL.
Populates authoritative, rule-driven statutory clocks from RFCTLARR Act 2013.
Hardened with decoupled CPM heuristic fields and statutory audit metadata.
"""
import asyncio
import json
import os
import sys
from dotenv import load_dotenv
import asyncpg

# Add backend to path
sys.path.insert(0, "backend")
from app.data.statutory_deadline_rules_data import DEADLINE_RULES_DATA

load_dotenv(".env")
db_url = os.getenv("DATABASE_URL").replace("postgresql+asyncpg://", "postgresql://")


async def seed_deadline_rules():
    conn = await asyncpg.connect(db_url)
    print(f"[*] Seeding {len(DEADLINE_RULES_DATA)} statutory deadline rules...")

    stmt = """
        INSERT INTO statutory_deadline_rules (
            id, legal_provision_id, rule_name, description, jurisdiction,
            applies_to_role, trigger_event, clock_type, duration_value,
            duration_unit, start_rule, end_rule, responsible_role,
            required_action, consequence_if_overdue, is_mandatory_lapse,
            cpm_delay_weight_days, rule_type, legal_effect, calculation_basis,
            statutory_vs_operational, operational_delay_cpm_days, operational_impact_notes,
            exception_type, verification_notes,
            calculation_notes, exceptions, source_url, source_version,
            effective_from, verification_status, updated_at
        ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11, $12, $13,
            $14, $15, $16,
            $17, $18, $19, $20,
            $21, $22, $23,
            $24, $25,
            $26, $27, $28, $29,
            $30::date, $31, now()
        )
        ON CONFLICT (id) DO UPDATE SET
            legal_provision_id = EXCLUDED.legal_provision_id,
            rule_name = EXCLUDED.rule_name,
            description = EXCLUDED.description,
            jurisdiction = EXCLUDED.jurisdiction,
            applies_to_role = EXCLUDED.applies_to_role,
            trigger_event = EXCLUDED.trigger_event,
            clock_type = EXCLUDED.clock_type,
            duration_value = EXCLUDED.duration_value,
            duration_unit = EXCLUDED.duration_unit,
            start_rule = EXCLUDED.start_rule,
            end_rule = EXCLUDED.end_rule,
            responsible_role = EXCLUDED.responsible_role,
            required_action = EXCLUDED.required_action,
            consequence_if_overdue = EXCLUDED.consequence_if_overdue,
            is_mandatory_lapse = EXCLUDED.is_mandatory_lapse,
            cpm_delay_weight_days = EXCLUDED.cpm_delay_weight_days,
            rule_type = EXCLUDED.rule_type,
            legal_effect = EXCLUDED.legal_effect,
            calculation_basis = EXCLUDED.calculation_basis,
            statutory_vs_operational = EXCLUDED.statutory_vs_operational,
            operational_delay_cpm_days = EXCLUDED.operational_delay_cpm_days,
            operational_impact_notes = EXCLUDED.operational_impact_notes,
            exception_type = EXCLUDED.exception_type,
            verification_notes = EXCLUDED.verification_notes,
            calculation_notes = EXCLUDED.calculation_notes,
            exceptions = EXCLUDED.exceptions,
            source_url = EXCLUDED.source_url,
            source_version = EXCLUDED.source_version,
            effective_from = EXCLUDED.effective_from,
            verification_status = EXCLUDED.verification_status,
            updated_at = now();
    """

    from datetime import date

    for r in DEADLINE_RULES_DATA:
        eff_date = date.fromisoformat(r["effective_from"]) if r.get("effective_from") else None
        await conn.execute(
            stmt,
            r["id"],
            r["legal_provision_id"],
            r["rule_name"],
            r["description"],
            r["jurisdiction"],
            r["applies_to_role"],
            r["trigger_event"],
            r["clock_type"],
            r["duration_value"],
            r["duration_unit"],
            r["start_rule"],
            r["end_rule"],
            r["responsible_role"],
            r["required_action"],
            r["consequence_if_overdue"],
            r["is_mandatory_lapse"],
            r["cpm_delay_weight_days"],
            r.get("rule_type", "PROCEDURAL_WINDOW"),
            r.get("legal_effect", "ACTION_REQUIRED"),
            r.get("calculation_basis"),
            r.get("statutory_vs_operational", "STATUTORY"),
            r.get("operational_delay_cpm_days", 0),
            r.get("operational_impact_notes"),
            r.get("exception_type"),
            r.get("verification_notes"),
            r["calculation_notes"],
            json.dumps(r["exceptions"]),
            r["source_url"],
            r["source_version"],
            eff_date,
            r["verification_status"],
        )

    count = await conn.fetchval("SELECT count(*) FROM statutory_deadline_rules")
    print(f"[+] Successfully seeded statutory deadline rules! Total in DB: {count}")
    await conn.close()


if __name__ == "__main__":
    asyncio.run(seed_deadline_rules())
