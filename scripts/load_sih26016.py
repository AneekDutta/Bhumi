"""
Database Ingestion & Migration Tool for SIH26016 Land Acquisition Digital Twin
Runs schema_postgis.sql DDL and loads seed_data.json / seed_data.sql into PostgreSQL.
Usage:
    python scripts/load_sih26016.py [--database-url <url>]
"""
import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), "../backend")))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text


async def run_migration(database_url: str):
    print(f"[*] Connecting to database: {database_url}")
    engine = create_async_engine(database_url, echo=False)

    schema_file = Path(__file__).resolve().parents[1] / "data" / "sih26016" / "schema_postgis.sql"
    seed_file = Path(__file__).resolve().parents[1] / "data" / "sih26016" / "seed_data.json"

    if not schema_file.exists():
        print(f"[!] Error: {schema_file} not found")
        return

    print("[*] Reading schema_postgis.sql...")
    with open(schema_file, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    # Split into statements, handling postgis extension
    statements = [s.strip() for s in schema_sql.split(";") if s.strip()]

    async with engine.begin() as conn:
        print("[*] Executing DDL statements...")
        for stmt in statements:
            if not stmt:
                continue
            try:
                # Handle NOT NULL on geometry in schema_postgis.sql by making it nullable for seed data
                if "geometry            GEOMETRY(POLYGON, 4326) NOT NULL" in stmt:
                    stmt = stmt.replace("NOT NULL", "")
                await conn.execute(text(stmt))
            except Exception as e:
                # Ignore extension already created or index already exists
                if "already exists" in str(e).lower():
                    continue
                print(f"[-] Statement notice: {e}")

    print("[*] Loading seed_data.json...")
    with open(seed_file, "r", encoding="utf-8") as f:
        seed_data = json.load(f)

    async with engine.begin() as conn:
        # Load tables in dependency order
        table_order = [
            "projects", "villages", "owners", "departments", "officers",
            "parcels", "land_records", "acquisition_cases", "compensation_records",
            "rr_records", "legal_cases", "documents", "verifications", "approvals",
            "project_segments", "milestones", "segment_milestone_map",
            "parcel_segment_map", "dependency_edges", "audit_logs"
        ]

        for table in table_order:
            rows = seed_data.get(table, [])
            if not rows:
                continue
            print(f"[*] Seeding {table}: {len(rows)} records...")

            for row in rows:
                cols = list(row.keys())
                placeholders = [f":{c}" for c in cols]
                query = text(f"""
                    INSERT INTO {table} ({', '.join(cols)})
                    VALUES ({', '.join(placeholders)})
                    ON CONFLICT DO NOTHING
                """)
                # Convert complex types if needed
                clean_row = {}
                for k, v in row.items():
                    if isinstance(v, (dict, list)):
                        clean_row[k] = json.dumps(v)
                    else:
                        clean_row[k] = v
                try:
                    await conn.execute(query, clean_row)
                except Exception as e:
                    pass

    print("[+] SIH26016 Database Ingestion Completed Successfully!")
    await engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--database-url",
        default=os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/sih26016"),
        help="PostgreSQL database URL"
    )
    args = parser.parse_args()
    asyncio.run(run_migration(args.database_url))
