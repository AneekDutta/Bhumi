#!/usr/bin/env python3
"""
SIH26016 — Synthetic Digital Twin Data Generator
=================================================
Generates INTERNALLY CONSISTENT synthetic data for the Land Acquisition
Digital Twin prototype. Every record is tagged source_type=SYNTHETIC.
This is NOT real data and must never be presented as such.

Usage:
    python synthetic_data_generator.py --size SMALL --seed 42 --out ./seed_output
    python synthetic_data_generator.py --size MEDIUM --seed 7   --out ./seed_output

Size presets (parcel counts), per the spec:
    SMALL  : 100-500
    MEDIUM : 500-2500
    LARGE  : 2500-10000
"""
import argparse
import csv
import json
import os
import random
from datetime import date, timedelta

SIZE_PRESETS = {
    "SMALL": (100, 500),
    "MEDIUM": (500, 2500),
    "LARGE": (2500, 10000),
}

VILLAGE_NAMES = [
    "Kanhera Kalan", "Bardoli Khera", "Chandwas", "Ratanpura", "Devri Kalan",
    "Sultanpura", "Nimbahera Chhoti", "Kotra Bhil", "Baori", "Simalwara Kalan",
]
FIRST_NAMES = ["Ramesh", "Suresh", "Kamla", "Geeta", "Mahesh", "Radha", "Om Prakash",
               "Shanti", "Bhanwar", "Kailash", "Prem", "Sita", "Girdhari", "Champa"]
LAST_NAMES = ["Meena", "Sharma", "Gujjar", "Yadav", "Suthar", "Mali", "Jat", "Rathore"]
DEPARTMENTS = [
    ("D01", "District Revenue Department"),
    ("D02", "PWD Highways Division"),
    ("D03", "District Collectorate — LA Cell"),
    ("D04", "Social Welfare Dept (R&R)"),
]
DESIGNATIONS = ["Tehsildar", "Land Acquisition Officer", "Patwari", "Field Surveyor", "SDM"]


def rng_id(prefix, i, width=5):
    return f"{prefix}{i:0{width}d}"


def make_owners(r, n_owners):
    owners = []
    for i in range(1, n_owners + 1):
        name = f"{r.choice(FIRST_NAMES)} {r.choice(LAST_NAMES)}"
        owners.append({
            "owner_id": rng_id("O", i),
            "name": name,
            "owner_type": r.choices(["individual", "joint", "institutional"], weights=[80, 18, 2])[0],
            "contact_village": None,  # filled after villages assigned
            "source_type": "SYNTHETIC",
        })
    return owners


def build_dataset(size_key, seed, project_id="P-NH927A", project_name="NH-927A Kota-Jhalawar Bypass Widening (SYNTHETIC)"):
    r = random.Random(seed)
    lo, hi = SIZE_PRESETS[size_key]
    n_parcels = r.randint(lo, min(hi, lo + (hi - lo) // 4))  # keep demo runs on the smaller side of the band

    n_villages = min(len(VILLAGE_NAMES), max(3, n_parcels // 80))
    villages = []
    for i in range(n_villages):
        villages.append({
            "village_id": rng_id("V", i + 1, 2),
            "project_id": project_id,
            "name": VILLAGE_NAMES[i],
            "tehsil": "Ramganj Mandi",
            "district": "Kota",
            "state": "Rajasthan",
            "population": r.randint(800, 6000),
            "source_type": "SYNTHETIC",
        })

    n_owners = max(20, n_parcels // 3)
    owners = make_owners(r, n_owners)
    for o in owners:
        o["contact_village"] = r.choice(villages)["village_id"]

    departments = [{"department_id": d[0], "name": d[1], "jurisdiction": "Kota District", "source_type": "SYNTHETIC"} for d in DEPARTMENTS]
    officers = []
    for i in range(1, max(6, n_parcels // 150) + 1):
        officers.append({
            "officer_id": rng_id("OF", i, 3),
            "name": f"{r.choice(FIRST_NAMES)} {r.choice(LAST_NAMES)}",
            "designation": r.choice(DESIGNATIONS),
            "department_id": r.choice(departments)["department_id"],
            "source_type": "SYNTHETIC",
        })

    # scenario injectors — deliberately assigned proportions, not pure randomness
    SCENARIO_WEIGHTS = {
        "clean": 0.42,
        "ownership_mismatch": 0.10,
        "missing_documents": 0.10,
        "duplicate_ownership": 0.05,
        "compensation_pending": 0.10,
        "legal_dispute": 0.07,
        "rr_pending": 0.06,
        "approval_bottleneck": 0.05,
        "inaccessible_parcel": 0.02,
        "field_verification_pending": 0.02,
        "acquired_possession_pending": 0.01,
    }
    scenarios = list(SCENARIO_WEIGHTS.keys())
    weights = list(SCENARIO_WEIGHTS.values())

    n_segments = max(4, n_villages)
    segments = [{
        "segment_id": rng_id("S", i + 1, 2),
        "project_id": project_id,
        "name": f"Segment {i+1}",
        "chainage_start": i * 5.0,
        "chainage_end": (i + 1) * 5.0,
        "status": "in_progress",
        "source_type": "SYNTHETIC",
    } for i in range(n_segments)]

    n_milestones = max(2, n_segments // 2)
    milestones = [{
        "milestone_id": rng_id("M", i + 1, 2),
        "project_id": project_id,
        "name": f"Milestone {i+1}",
        "target_date": str(date(2027, 1, 1) + timedelta(days=90 * i)),
        "status": "pending",
        "source_type": "SYNTHETIC",
    } for i in range(n_milestones)]
    segment_milestone_map = []
    per_ms = max(1, n_segments // n_milestones)
    for si, seg in enumerate(segments):
        ms = milestones[min(si // per_ms, n_milestones - 1)]
        segment_milestone_map.append({"segment_id": seg["segment_id"], "milestone_id": ms["milestone_id"]})

    parcels, land_records, acquisition_cases, compensation_records = [], [], [], []
    rr_records, legal_cases, documents, verifications, approvals = [], [], [], [], []
    parcel_segment_map, dependency_edges, audit_logs = [], [], []

    # pick a small, deliberate set of "hidden critical" parcels: low visible severity,
    # but structurally gating an entire segment (single point of failure).
    hidden_critical_count = max(2, n_parcels // 250)
    hidden_critical_indices = set(r.sample(range(1, n_parcels + 1), min(hidden_critical_count, n_parcels)))

    today = date(2026, 9, 5)

    for i in range(1, n_parcels + 1):
        pid = rng_id("P", i)
        village = villages[i % n_villages]
        owner = r.choice(owners)
        segment = segments[i % n_segments]
        area = round(r.uniform(200, 4000), 1)  # sqm, plausible rural parcel range
        land_use = r.choices(["agricultural", "residential", "barren", "commercial"], weights=[70, 15, 10, 5])[0]

        is_hidden_critical = i in hidden_critical_indices
        scenario = "clean" if is_hidden_critical else r.choices(scenarios, weights=weights)[0]

        ownership_conflict = scenario in ("ownership_mismatch", "duplicate_ownership")
        conflict_type = {
            "ownership_mismatch": "boundary_dispute",
            "duplicate_ownership": "duplicate_claim",
        }.get(scenario, "none")

        acquisition_status_map = {
            "clean": "possessed",
            "compensation_pending": "award_declared",
            "legal_dispute": "notified",
            "rr_pending": "compensated",
            "acquired_possession_pending": "compensated",
            "inaccessible_parcel": "notified",
            "field_verification_pending": "notified",
        }
        acq_status = acquisition_status_map.get(scenario, "notified")

        parcels.append({
            "parcel_id": pid,
            "project_id": project_id,
            "village_id": village["village_id"],
            "survey_number": f"{village['village_id']}-KH-{i:04d}",
            "area_sqm": area,
            "land_use": land_use,
            "acquisition_status": acq_status,
            "owner_id": owner["owner_id"],
            "ownership_conflict": ownership_conflict,
            "conflict_type": conflict_type,
            "criticality_score": None,   # MODEL_DERIVED, left for the platform's own engine to compute
            "risk_score": None,          # MODEL_DERIVED
            "is_hidden_critical": is_hidden_critical,
            "scenario_tag": scenario,    # generator metadata, for QA/grading — not a platform field
            "source_type": "SYNTHETIC",
        })
        parcel_segment_map.append({"parcel_id": pid, "segment_id": segment["segment_id"]})

        land_records.append({
            "record_id": rng_id("LR", i),
            "parcel_id": pid,
            "record_type": "jamabandi",
            "record_date": str(today - timedelta(days=r.randint(30, 2000))),
            "source_type": "SYNTHETIC",
        })

        case_id = rng_id("AC", i)
        notif_date = today - timedelta(days=r.randint(60, 900))
        acquisition_cases.append({
            "case_id": case_id,
            "parcel_id": pid,
            "notification_date": str(notif_date),
            "declaration_date": str(notif_date + timedelta(days=45)) if acq_status != "notified" else None,
            "award_date": str(notif_date + timedelta(days=180)) if acq_status in ("award_declared", "compensated", "possessed") else None,
            "possession_date": str(notif_date + timedelta(days=300)) if acq_status == "possessed" else None,
            "status": {"notified": "notified", "award_declared": "compensation_pending",
                       "compensated": "compensation_pending", "possessed": "possessed"}[acq_status],
            "source_type": "SYNTHETIC",
        })
        dependency_edges.append({"from_node_type": "parcel", "from_node_id": pid,
                                  "to_node_type": "acquisition_case", "to_node_id": case_id,
                                  "edge_type": "has", "is_blocking": False, "weight_days": None,
                                  "source_type": "SYNTHETIC"})

        if acq_status in ("award_declared", "compensated", "possessed"):
            market_value_base = round(area * r.uniform(400, 1800), 2)  # Rs/sqm plausible range, synthetic
            multiplier = round(r.uniform(1.0, 2.0), 2)
            asset_value = round(r.uniform(0, market_value_base * 0.3), 2)
            severance = round(r.uniform(0, market_value_base * 0.05), 2)
            subtotal = round(market_value_base * multiplier + asset_value + severance, 2)
            solatium = round(subtotal * 1.0, 2)  # Sec 30(1): 100% of subtotal
            interest = round(market_value_base * 0.12 * (300 / 365), 2)  # Sec 30(3), illustrative period
            total = round(subtotal + solatium + interest, 2)
            comp_status = "disputed" if scenario == "compensation_pending" else (
                "pending" if scenario == "acquired_possession_pending" else "disbursed")
            compensation_records.append({
                "compensation_id": rng_id("CR", i),
                "case_id": case_id,
                "market_value_base": market_value_base,
                "multiplier_factor": multiplier,
                "asset_value": asset_value,
                "severance_damage": severance,
                "subtotal_before_solatium": subtotal,
                "solatium_amount": solatium,
                "interest_12pct_amount": interest,
                "total_compensation": total,
                "compensation_status": comp_status,
                "source_type": "MODEL_DERIVED",
            })
            if comp_status != "disbursed":
                dependency_edges.append({"from_node_type": "acquisition_case", "from_node_id": case_id,
                                          "to_node_type": "compensation_record", "to_node_id": rng_id("CR", i),
                                          "edge_type": "requires", "is_blocking": True, "weight_days": 60,
                                          "source_type": "SYNTHETIC"})

        if scenario == "rr_pending" or (land_use == "residential" and r.random() < 0.3):
            rr_records.append({
                "rr_id": rng_id("RR", i),
                "case_id": case_id,
                "family_type": r.choice(["titleholder", "landless_labourer", "tenant"]),
                "housing_entitlement": round(r.uniform(100000, 500000), 2),
                "subsistence_allowance": round(r.uniform(3000, 6000), 2),
                "transport_allowance": 50000,
                "resettlement_allowance": round(r.uniform(50000, 200000), 2),
                "livelihood_option": r.choice(["annuity", "employment", "one_time"]),
                "rr_status": "pending" if scenario == "rr_pending" else "completed",
                "source_type": "SYNTHETIC",
            })
            if scenario == "rr_pending":
                dependency_edges.append({"from_node_type": "acquisition_case", "from_node_id": case_id,
                                          "to_node_type": "rr_record", "to_node_id": rng_id("RR", i),
                                          "edge_type": "requires", "is_blocking": True, "weight_days": 90,
                                          "source_type": "SYNTHETIC"})

        if scenario == "legal_dispute":
            lc_id = rng_id("LC", i)
            legal_cases.append({
                "legal_case_id": lc_id,
                "case_id": case_id,
                "case_name": f"{r.choice(FIRST_NAMES)} {r.choice(LAST_NAMES)} vs State of Rajasthan",
                "court": "Rajasthan High Court",
                "filed_date": str(notif_date + timedelta(days=30)),
                "legal_issue": r.choice(["notification_challenge", "compensation_dispute", "possession_dispute"]),
                "legal_status": r.choice(["filed", "in_hearing", "stayed"]),
                "decision_notes": None,
                "is_reference_case": False,
                "source_type": "SYNTHETIC",
            })
            dependency_edges.append({"from_node_type": "legal_case", "from_node_id": lc_id,
                                      "to_node_type": "acquisition_case", "to_node_id": case_id,
                                      "edge_type": "blocks", "is_blocking": True, "weight_days": 400,
                                      "source_type": "SYNTHETIC"})

        doc_status = "missing" if scenario == "missing_documents" else r.choices(
            ["verified", "submitted", "under_verification"], weights=[70, 20, 10])[0]
        doc_id = rng_id("D", i)
        documents.append({
            "document_id": doc_id,
            "case_id": case_id,
            "parcel_id": pid,
            "document_type": r.choice(["notification", "title_deed", "mutation_certificate"]),
            "upload_date": str(notif_date + timedelta(days=5)) if doc_status != "missing" else None,
            "document_status": doc_status,
            "source_type": "SYNTHETIC",
        })
        ver_id = rng_id("VF", i)
        ver_status = "rejected" if doc_status == "missing" else ("pending" if scenario == "field_verification_pending" else "verified")
        verifications.append({
            "verification_id": ver_id,
            "document_id": doc_id,
            "parcel_id": pid,
            "verification_type": "ownership" if scenario != "field_verification_pending" else "field",
            "status": ver_status,
            "officer_id": r.choice(officers)["officer_id"],
            "source_type": "SYNTHETIC",
        })
        if ver_status != "verified":
            dependency_edges.append({"from_node_type": "verification", "from_node_id": ver_id,
                                      "to_node_type": "document", "to_node_id": doc_id,
                                      "edge_type": "blocked_by", "is_blocking": True, "weight_days": 30,
                                      "source_type": "SYNTHETIC"})

        if scenario == "approval_bottleneck":
            approvals.append({
                "approval_id": rng_id("AP", i),
                "entity_type": "compensation",
                "entity_id": case_id,
                "officer_id": r.choice(officers)["officer_id"],
                "department_id": r.choice(departments)["department_id"],
                "approval_status": "escalated",
                "source_type": "SYNTHETIC",
            })

        dependency_edges.append({"from_node_type": "parcel", "from_node_id": pid,
                                  "to_node_type": "project_segment", "to_node_id": segment["segment_id"],
                                  "edge_type": "required_for",
                                  "is_blocking": acq_status != "possessed" or ownership_conflict,
                                  "weight_days": 60, "source_type": "SYNTHETIC"})

        audit_logs.append({
            "entity_type": "parcel", "entity_id": pid, "action": "created",
            "actor_id": "system", "timestamp": str(notif_date), "source_type": "SYNTHETIC",
        })

    for seg in segments:
        for ms_map in segment_milestone_map:
            if ms_map["segment_id"] == seg["segment_id"]:
                dependency_edges.append({"from_node_type": "project_segment", "from_node_id": seg["segment_id"],
                                          "to_node_type": "milestone", "to_node_id": ms_map["milestone_id"],
                                          "edge_type": "required_for", "is_blocking": True, "weight_days": 0,
                                          "source_type": "SYNTHETIC"})

    project = {
        "project_id": project_id, "name": project_name, "project_type": "highway",
        "state": "Rajasthan", "district": "Kota", "estimated_cost": round(n_parcels * 850000, 2),
        "start_date": "2025-04-01", "target_completion": "2028-03-31",
        "status": "in_progress", "source_type": "SYNTHETIC",
    }

    return {
        "projects": [project], "villages": villages, "owners": owners,
        "departments": departments, "officers": officers, "parcels": parcels,
        "land_records": land_records, "acquisition_cases": acquisition_cases,
        "compensation_records": compensation_records, "rr_records": rr_records,
        "legal_cases": legal_cases, "documents": documents, "verifications": verifications,
        "approvals": approvals, "project_segments": segments, "milestones": milestones,
        "segment_milestone_map": segment_milestone_map, "parcel_segment_map": parcel_segment_map,
        "dependency_edges": dependency_edges, "audit_logs": audit_logs,
    }


def write_json(data, outdir):
    with open(os.path.join(outdir, "seed_data.json"), "w") as f:
        json.dump(data, f, indent=2, default=str)


def write_csv(data, outdir):
    for table, rows in data.items():
        if not rows:
            continue
        path = os.path.join(outdir, f"{table}.csv")
        keys = sorted({k for row in rows for k in row.keys()})
        with open(path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            for row in rows:
                writer.writerow(row)


def sql_escape(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


TABLE_COLUMN_ORDER = {
    "projects": ["project_id", "name", "project_type", "state", "district", "estimated_cost",
                 "start_date", "target_completion", "status", "source_type"],
    "villages": ["village_id", "project_id", "name", "tehsil", "district", "state", "population", "source_type"],
    "owners": ["owner_id", "name", "owner_type", "contact_village", "source_type"],
    "departments": ["department_id", "name", "jurisdiction", "source_type"],
    "officers": ["officer_id", "name", "designation", "department_id", "source_type"],
    "parcels": ["parcel_id", "project_id", "village_id", "survey_number", "area_sqm", "land_use",
                "acquisition_status", "owner_id", "ownership_conflict", "conflict_type",
                "is_hidden_critical", "source_type"],
    "land_records": ["record_id", "parcel_id", "record_type", "record_date", "source_type"],
    "acquisition_cases": ["case_id", "parcel_id", "notification_date", "declaration_date",
                           "award_date", "possession_date", "status", "source_type"],
    "compensation_records": ["compensation_id", "case_id", "market_value_base", "multiplier_factor",
                              "asset_value", "severance_damage", "subtotal_before_solatium",
                              "solatium_amount", "interest_12pct_amount", "total_compensation",
                              "compensation_status", "source_type"],
    "rr_records": ["rr_id", "case_id", "family_type", "housing_entitlement", "subsistence_allowance",
                   "transport_allowance", "resettlement_allowance", "livelihood_option", "rr_status", "source_type"],
    "legal_cases": ["legal_case_id", "case_id", "case_name", "court", "filed_date", "legal_issue",
                    "legal_status", "is_reference_case", "source_type"],
    "documents": ["document_id", "case_id", "parcel_id", "document_type", "upload_date",
                  "document_status", "source_type"],
    "verifications": ["verification_id", "document_id", "parcel_id", "verification_type", "status",
                       "officer_id", "source_type"],
    "approvals": ["approval_id", "entity_type", "entity_id", "officer_id", "department_id",
                  "approval_status", "source_type"],
    "project_segments": ["segment_id", "project_id", "name", "chainage_start", "chainage_end",
                          "status", "source_type"],
    "milestones": ["milestone_id", "project_id", "name", "target_date", "status", "source_type"],
    "segment_milestone_map": ["segment_id", "milestone_id"],
    "parcel_segment_map": ["parcel_id", "segment_id"],
    "dependency_edges": ["from_node_type", "from_node_id", "to_node_type", "to_node_id",
                          "edge_type", "is_blocking", "weight_days", "source_type"],
    "audit_logs": ["entity_type", "entity_id", "action", "actor_id", "timestamp", "source_type"],
}


def write_sql(data, outdir):
    path = os.path.join(outdir, "seed_data.sql")
    with open(path, "w") as f:
        f.write("-- SIH26016 synthetic seed data — internally consistent, source_type='SYNTHETIC' throughout\n")
        f.write("BEGIN;\n\n")
        for table, rows in data.items():
            if not rows or table not in TABLE_COLUMN_ORDER:
                continue
            cols = TABLE_COLUMN_ORDER[table]
            f.write(f"-- {table} ({len(rows)} rows)\n")
            for row in rows:
                vals = [sql_escape(row.get(c)) for c in cols]
                f.write(f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({', '.join(vals)});\n")
            f.write("\n")
        f.write("COMMIT;\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--size", choices=list(SIZE_PRESETS.keys()), default="SMALL")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--out", default="./seed_output")
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    data = build_dataset(args.size, args.seed)
    write_json(data, args.out)
    write_csv(data, args.out)
    write_sql(data, args.out)

    print(f"Generated {len(data['parcels'])} parcels across {len(data['villages'])} villages.")
    print(f"Scenario tag distribution:")
    from collections import Counter
    c = Counter(p["scenario_tag"] for p in data["parcels"])
    for k, v in c.most_common():
        print(f"  {k}: {v}")
    print(f"Output written to {args.out}/ (seed_data.json, per-table CSVs, seed_data.sql)")


if __name__ == "__main__":
    main()
