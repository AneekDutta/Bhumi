"""
SIH26016 Data and Geospatial Service
Loads and serves the SIH26016 Land Acquisition Digital Twin dataset.
Supports database queries with automatic local seed fallback, CPM computations,
GeoJSON FeatureCollection generation, and full Section 13 parcel dossier compilation.
"""
import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

from app.services.cpm_engine import cpm_engine
from app.services.whatif_simulator import whatif_simulator


class SIH26016Service:
    def __init__(self):
        self._data_cache: dict[str, Any] | None = None
        self._cpm_cache: dict[str, Any] | None = None
        self._parcels_geojson_cache: dict[str, Any] | None = None
        self._load_data()

    def _get_seed_path(self) -> Path:
        # Search relative to repo root
        candidates = [
            Path("data/sih26016/seed_data.json"),
            Path("../data/sih26016/seed_data.json"),
            Path(__file__).resolve().parents[3] / "data" / "sih26016" / "seed_data.json",
        ]
        for p in candidates:
            if p.exists():
                return p
        raise FileNotFoundError("Could not locate data/sih26016/seed_data.json")

    def _load_data(self):
        try:
            seed_path = self._get_seed_path()
            with open(seed_path, "r", encoding="utf-8") as f:
                self._data_cache = json.load(f)
            self._enrich_and_compute()
        except Exception as e:
            print(f"[SIH26016Service] Warning loading seed_data.json: {e}")
            self._data_cache = {}

    def _enrich_and_compute(self):
        """Precomputes CPM schedules, scores, and cadastral coordinates."""
        if not self._data_cache or "parcels" not in self._data_cache:
            return

        data = self._data_cache
        edges = data.get("dependency_edges", [])
        parcels = data.get("parcels", [])
        cases = {c["parcel_id"]: c for c in data.get("acquisition_cases", [])}
        compensations = {cr["case_id"]: cr for cr in data.get("compensation_records", [])}
        legals = {lc["case_id"]: lc for lc in data.get("legal_cases", [])}
        docs = {}
        for d in data.get("documents", []):
            docs.setdefault(d["parcel_id"], []).append(d)

        # Build Graph and run baseline CPM
        G_blocking = cpm_engine.build_networkx_graph(edges, filter_blocking=True)
        G_full = cpm_engine.build_networkx_graph(edges, filter_blocking=False)

        cpm_result = cpm_engine.compute_cpm_schedule(
            G_blocking,
            project_start_date=date(2025, 4, 1),
            base_target_date=date(2028, 3, 31)
        )
        self._cpm_cache = cpm_result
        critical_nodes = set(cpm_result["critical_path_nodes"])

        # Base coordinates near Ramganj Mandi / Kota (NH-927A alignment)
        # Lat: ~24.64 to ~24.76, Lng: ~75.92 to ~76.04
        center_lat = 24.6500
        center_lng = 75.9300
        dx = 0.00075  # ~80m per parcel along alignment
        dy = 0.00045  # ~50m width

        # Enrich parcels with scores, actions, critical path status, and realistic polygons
        enriched_parcels = []
        for idx, p in enumerate(parcels):
            pid = p["parcel_id"]
            case = cases.get(pid, {})
            cid = case.get("case_id")
            comp = compensations.get(cid, {})
            legal = legals.get(cid, {})
            parcel_docs = docs.get(pid, [])
            primary_doc = parcel_docs[0] if parcel_docs else {}

            p_node = f"parcel:{pid}"
            is_critical = p_node in critical_nodes

            crit_score, breakdown = cpm_engine.compute_parcel_criticality_score(
                pid,
                G_full,
                p.get("acquisition_status", "not_started"),
                is_spof=True
            )
            risk_score = cpm_engine.compute_parcel_risk_score(
                legal.get("legal_status"),
                comp.get("compensation_status"),
                p.get("ownership_conflict", False),
                primary_doc.get("document_status"),
                crit_score
            )
            rec_action = cpm_engine.generate_recommended_action(
                legal.get("legal_status"),
                comp.get("compensation_status"),
                p.get("ownership_conflict", False),
                p.get("conflict_type"),
                primary_doc.get("document_status"),
                p.get("acquisition_status", "not_started")
            )

            # Assign synthetic cadastral polygon coordinates along bypass curve
            # Village V01 = km 0-5, V02 = km 5-10, V03 = km 10-15
            v_offset = 0.0
            if p.get("village_id") == "V02":
                v_offset = 0.04
            elif p.get("village_id") == "V03":
                v_offset = 0.08

            row = idx % 2
            col = idx // 2
            p_lng = center_lng + (col * dx) + v_offset
            p_lat = center_lat + (col * dx * 0.7) + (row * dy)

            # 4-point polygon
            coords = [
                [round(p_lng, 6), round(p_lat, 6)],
                [round(p_lng + dx * 0.9, 6), round(p_lat, 6)],
                [round(p_lng + dx * 0.9, 6), round(p_lat + dy * 0.85, 6)],
                [round(p_lng, 6), round(p_lat + dy * 0.85, 6)],
                [round(p_lng, 6), round(p_lat, 6)],
            ]

            p_copy = dict(p)
            p_copy["criticality_score"] = crit_score
            p_copy["criticality_breakdown"] = breakdown
            p_copy["risk_score"] = risk_score
            p_copy["is_critical_path"] = is_critical
            p_copy["recommended_action"] = rec_action
            p_copy["geometry_coordinates"] = coords
            enriched_parcels.append(p_copy)

        self._data_cache["parcels"] = enriched_parcels

    def get_projects(self) -> list[dict[str, Any]]:
        if not self._data_cache:
            self._load_data()
        projects = self._data_cache.get("projects", [])
        parcels = self._data_cache.get("parcels", [])
        unresolved = [p for p in parcels if p.get("acquisition_status") != "possessed"]

        result = []
        for p in projects:
            p_copy = dict(p)
            p_copy["total_parcels"] = len(parcels)
            p_copy["unresolved_parcels"] = len(unresolved)
            if self._cpm_cache:
                p_copy["projected_completion"] = self._cpm_cache["projected_finish_date"]
                p_copy["project_delay_days"] = self._cpm_cache["project_delay_days"]
                p_copy["critical_path_blocked"] = len(self._cpm_cache["critical_path_nodes"]) > 0
            result.append(p_copy)
        return result

    def get_project_by_id(self, project_id: str) -> dict[str, Any] | None:
        projects = self.get_projects()
        for p in projects:
            if p["project_id"] == project_id:
                return p
        return projects[0] if projects else None

    def get_parcels(self, project_id: str | None = None) -> list[dict[str, Any]]:
        if not self._data_cache:
            self._load_data()
        parcels = self._data_cache.get("parcels", [])
        if project_id:
            return [p for p in parcels if p.get("project_id") == project_id]
        return parcels

    def get_parcel_detail(self, parcel_id: str) -> dict[str, Any] | None:
        if not self._data_cache:
            self._load_data()
        data = self._data_cache
        parcels = data.get("parcels", [])
        parcel = next((p for p in parcels if p["parcel_id"] == parcel_id), None)
        if not parcel:
            return None

        # Related records
        villages = {v["village_id"]: v for v in data.get("villages", [])}
        owners = {o["owner_id"]: o for o in data.get("owners", [])}
        projects = {pr["project_id"]: pr for pr in data.get("projects", [])}
        cases = {c["parcel_id"]: c for c in data.get("acquisition_cases", [])}
        compensations = {cr["case_id"]: cr for cr in data.get("compensation_records", [])}
        rrs = {rr["case_id"]: rr for rr in data.get("rr_records", [])}
        legals = [lc for lc in data.get("legal_cases", [])]
        documents = [d for d in data.get("documents", []) if d.get("parcel_id") == parcel_id]
        verifications = [v for v in data.get("verifications", []) if v.get("parcel_id") == parcel_id]
        edges = data.get("dependency_edges", [])

        v_info = villages.get(parcel.get("village_id"), {})
        o_info = owners.get(parcel.get("owner_id"), {})
        pr_info = projects.get(parcel.get("project_id"), {})
        case_info = cases.get(parcel_id, {})
        cid = case_info.get("case_id")
        comp_info = compensations.get(cid, {}) if cid else {}
        rr_info = rrs.get(cid, {}) if cid else {}
        legal_list = [lc for lc in legals if lc.get("case_id") == cid]

        # Upstream blockers
        upstream = []
        downstream = []
        for e in edges:
            if e["to_node_id"] == parcel_id and e.get("is_blocking"):
                upstream.append({
                    "from_type": e["from_node_type"],
                    "from_id": e["from_node_id"],
                    "edge_type": e["edge_type"],
                    "delay_days": e.get("weight_days")
                })
            elif e["from_node_id"] == parcel_id:
                downstream.append({
                    "to_type": e["to_node_type"],
                    "to_id": e["to_node_id"],
                    "edge_type": e["edge_type"]
                })

        area_sqm = float(parcel.get("area_sqm") or 0.0)
        area_ha = round(area_sqm / 10000.0, 4)

        return {
            "parcel_id": parcel_id,
            "project_id": parcel.get("project_id"),
            "project_name": pr_info.get("name", "NH-927A Kota-Jhalawar Bypass Widening"),
            "village_id": parcel.get("village_id"),
            "village_name": v_info.get("name", "Kanhera Kalan"),
            "tehsil": v_info.get("tehsil", "Ramganj Mandi"),
            "district": v_info.get("district", "Kota"),
            "state": v_info.get("state", "Rajasthan"),
            "survey_number": parcel.get("survey_number"),
            "area_sqm": area_sqm,
            "area_hectares": area_ha,
            "land_use": parcel.get("land_use"),
            "acquisition_status": parcel.get("acquisition_status"),
            "ownership_conflict": bool(parcel.get("ownership_conflict")),
            "conflict_type": parcel.get("conflict_type", "none"),
            "owner": o_info,
            "acquisition_case": case_info,
            "compensation": comp_info,
            "rr": rr_info,
            "legal_cases": legal_list,
            "documents": documents,
            "verifications": verifications,
            "upstream_blockers": upstream,
            "downstream_dependencies": downstream,
            "criticality_score": parcel.get("criticality_score", 0.0),
            "criticality_breakdown": parcel.get("criticality_breakdown"),
            "risk_score": parcel.get("risk_score", 0.0),
            "recommended_action": parcel.get("recommended_action", "Proceed with verification"),
            "is_critical_path": parcel.get("is_critical_path", False),
            "source_type": parcel.get("source_type", "SYNTHETIC")
        }

    def get_parcels_geojson(self, project_id: str | None = None) -> dict[str, Any]:
        """
        Generates GeoJSON FeatureCollection supporting:
        - Normal Mode: acquisition_status
        - Risk Mode: risk_score
        - Critical Path Mode: is_critical_path
        """
        parcels = self.get_parcels(project_id)
        villages = {v["village_id"]: v["name"] for v in self._data_cache.get("villages", [])}
        owners = {o["owner_id"]: o["name"] for o in self._data_cache.get("owners", [])}

        features = []
        for p in parcels:
            coords = p.get("geometry_coordinates")
            if not coords:
                continue

            crit = float(p.get("criticality_score") or 0.0)
            risk = float(p.get("risk_score") or 0.0)
            is_cp = bool(p.get("is_critical_path"))

            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [coords]
                },
                "properties": {
                    "parcel_id": p["parcel_id"],
                    "survey_number": p["survey_number"],
                    "village_id": p["village_id"],
                    "village_name": villages.get(p["village_id"], "Ramganj Mandi"),
                    "owner_name": owners.get(p.get("owner_id"), "Landholder"),
                    "area_sqm": float(p.get("area_sqm") or 0),
                    "area_hectares": round(float(p.get("area_sqm") or 0) / 10000.0, 4),
                    "land_use": p.get("land_use"),
                    "acquisition_status": p.get("acquisition_status"),
                    "ownership_conflict": p.get("ownership_conflict", False),
                    "conflict_type": p.get("conflict_type", "none"),
                    "criticality_score": crit,
                    "risk_score": risk,
                    "is_critical_path": is_cp,
                    "recommended_action": p.get("recommended_action"),
                    "source_type": p.get("source_type", "SYNTHETIC")
                }
            }
            features.append(feature)

        return {
            "type": "FeatureCollection",
            "features": features,
            "properties": {
                "corridor": "NH-927A Kota-Jhalawar Bypass Widening",
                "center": [75.98, 24.69],
                "zoom": 13,
                "total_parcels": len(features),
                "source_type": "SYNTHETIC"
            }
        }

    def get_critical_path_report(self, project_id: str | None = None) -> dict[str, Any]:
        if not self._data_cache or not self._cpm_cache:
            self._load_data()

        cpm = self._cpm_cache or {}
        parcels = self.get_parcels(project_id)
        villages = {v["village_id"]: v["name"] for v in self._data_cache.get("villages", [])}

        bottlenecks = []
        for p in parcels:
            if p.get("is_critical_path") or (p.get("risk_score") or 0) >= 30.0 or p.get("ownership_conflict"):
                risk = float(p.get("risk_score") or 0.0)
                urgency = "CRITICAL" if p.get("is_critical_path") else ("HIGH" if risk >= 50 else "MEDIUM")
                bottlenecks.append({
                    "parcel_id": p["parcel_id"],
                    "survey_number": p["survey_number"],
                    "village_name": villages.get(p["village_id"], "Ramganj Mandi"),
                    "delay_days": round(risk * 0.75, 1),
                    "urgency": urgency,
                    "is_critical_path": p.get("is_critical_path", False),
                    "risk_score": risk,
                    "criticality_score": float(p.get("criticality_score") or 0.0),
                    "active_blocker": p.get("conflict_type") if p.get("ownership_conflict") else p.get("acquisition_status"),
                    "recommended_action": p.get("recommended_action", "Clear legal/document blocker"),
                    "causal_chain": [
                        f"Parcel {p['survey_number']} in status {p.get('acquisition_status')}",
                        "Gating corridor possession Right-of-Way",
                        "Directly consuming critical chain float"
                    ]
                })

        # Sort bottlenecks by criticality & risk descending
        bottlenecks.sort(key=lambda b: (b["is_critical_path"], b["risk_score"]), reverse=True)

        return {
            "project_id": project_id or "P-NH927A",
            "baseline_finish": "2028-03-31",
            "projected_finish": cpm.get("projected_finish_date", "2028-11-15"),
            "project_delay_days": cpm.get("project_delay_days", 229),
            "critical_path_length_days": cpm.get("total_duration_days", 780.0),
            "critical_path_nodes": cpm.get("critical_path_nodes", []),
            "critical_path_parcels": [p["parcel_id"] for p in parcels if p.get("is_critical_path")],
            "bottlenecks": bottlenecks,
            "source_type": "MODEL_DERIVED"
        }

    def simulate(
        self,
        project_id: str,
        intervention_type: str,
        input_entity_ids: list[str],
        acceleration_factor: float = 1.0
    ) -> dict[str, Any]:
        if not self._data_cache:
            self._load_data()
        edges = self._data_cache.get("dependency_edges", [])
        parcels_map = {p["parcel_id"]: p for p in self.get_parcels(project_id)}

        return whatif_simulator.simulate(
            base_edges=edges,
            intervention_type=intervention_type,
            target_entity_ids=input_entity_ids,
            parcels_lookup=parcels_map,
            project_start_date=date(2025, 4, 1),
            target_completion_date=date(2028, 3, 31),
            acceleration_factor=acceleration_factor
        )

    def get_field_officers(self) -> list[dict[str, Any]]:
        if not self._data_cache:
            self._load_data()
        officers = self._data_cache.get("officers", [])
        departments = {d["department_id"]: d["name"] for d in self._data_cache.get("departments", [])}
        verifications = self._data_cache.get("verifications", [])
        parcels = self._data_cache.get("parcels", [])

        results = []
        for o in officers:
            oid = o["officer_id"]
            assigned_vils = o.get("assigned_villages") or []
            if not assigned_vils:
                if oid == "OF001":
                    assigned_vils = ["V01", "V02", "V03"]
                elif oid == "OF002":
                    assigned_vils = ["V01"]
                elif oid == "OF003":
                    assigned_vils = ["V02"]
                elif oid == "OF004":
                    assigned_vils = ["V02", "V03"]
                elif oid == "OF005":
                    assigned_vils = ["V01", "V02"]
                else:
                    assigned_vils = ["V01", "V02", "V03"]

            assigned_parcels = [p for p in parcels if p.get("village_id") in assigned_vils]
            verified_pids = {v["parcel_id"] for v in verifications if v.get("status") == "verified"}
            pending_count = sum(1 for p in assigned_parcels if p["parcel_id"] not in verified_pids)

            results.append({
                "officer_id": oid,
                "name": o["name"],
                "designation": o.get("designation", "Field Officer"),
                "department_id": o.get("department_id"),
                "department_name": departments.get(o.get("department_id"), "Revenue & Land Acquisition"),
                "assigned_villages": assigned_vils,
                "pending_tasks_count": pending_count,
                "source_type": o.get("source_type", "SYNTHETIC"),
            })
        return results

    def get_officer_parcels(
        self,
        officer_id: str | None = None,
        village_id: str | None = None
    ) -> list[dict[str, Any]]:
        if not self._data_cache:
            self._load_data()

        parcels = self.get_parcels()
        villages = {v["village_id"]: v for v in self._data_cache.get("villages", [])}
        owners = {o["owner_id"]: o["name"] for o in self._data_cache.get("owners", [])}
        verifs = self._data_cache.get("verifications", [])
        verifs_by_parcel: dict[str, list[dict[str, Any]]] = {}
        for v in verifs:
            verifs_by_parcel.setdefault(v.get("parcel_id"), []).append(v)

        assigned_vils: list[str] | None = None
        if officer_id:
            officers = self.get_field_officers()
            officer = next((o for o in officers if o["officer_id"] == officer_id), None)
            if officer and officer.get("assigned_villages"):
                assigned_vils = officer["assigned_villages"]

        results = []
        for p in parcels:
            v_id = p.get("village_id")
            if village_id and v_id != village_id:
                continue
            if assigned_vils is not None and v_id not in assigned_vils:
                continue

            v_info = villages.get(v_id, {})
            coords = p.get("geometry_coordinates", [])
            c_lat = None
            c_lng = None
            if coords:
                c_lng = sum(pt[0] for pt in coords) / len(coords)
                c_lat = sum(pt[1] for pt in coords) / len(coords)

            p_verifs = verifs_by_parcel.get(p["parcel_id"], [])
            latest_verif = p_verifs[-1] if p_verifs else None
            verif_status = latest_verif.get("status", "pending") if latest_verif else "pending"

            results.append({
                "parcel_id": p["parcel_id"],
                "survey_number": p["survey_number"],
                "village_id": v_id,
                "village_name": v_info.get("name", "Ramganj Mandi"),
                "owner_id": p.get("owner_id"),
                "owner_name": owners.get(p.get("owner_id"), "Registered Landholder"),
                "area_sqm": float(p.get("area_sqm") or 0.0),
                "area_hectares": round(float(p.get("area_sqm") or 0.0) / 10000.0, 4),
                "land_use": p.get("land_use", "agricultural"),
                "acquisition_status": p.get("acquisition_status", "not_started"),
                "ownership_conflict": bool(p.get("ownership_conflict")),
                "conflict_type": p.get("conflict_type", "none"),
                "criticality_score": float(p.get("criticality_score") or 0.0),
                "risk_score": float(p.get("risk_score") or 0.0),
                "is_critical_path": bool(p.get("is_critical_path")),
                "recommended_action": p.get("recommended_action"),
                "verification_status": verif_status,
                "latest_verification": latest_verif,
                "centroid_lat": round(c_lat, 6) if c_lat else None,
                "centroid_lng": round(c_lng, 6) if c_lng else None,
                "geometry_coordinates": coords,
                "source_type": p.get("source_type", "SYNTHETIC"),
            })
        return results

    def record_field_verification(self, report: dict[str, Any]) -> dict[str, Any]:
        if not self._data_cache:
            self._load_data()

        pid = report["parcel_id"]
        officer_id = report.get("officer_id", "OF001")
        officer_name = report.get("officer_name", "Field Officer")
        has_issue = bool(report.get("has_issue")) or report.get("status") in ["rejected", "disputed"]
        issue_type = report.get("issue_type") or ("ownership_mismatch" if has_issue else None)
        issue_severity = report.get("issue_severity", "MEDIUM")

        before_cpm = self._cpm_cache or {}
        before_delay = int(before_cpm.get("project_delay_days", 0))

        parcels = self._data_cache.get("parcels", [])
        parcel = next((p for p in parcels if p["parcel_id"] == pid), None)
        if not parcel:
            raise ValueError(f"Parcel {pid} not found in digital twin")

        old_status = parcel.get("acquisition_status")
        old_conflict = parcel.get("ownership_conflict", False)

        if has_issue:
            parcel["ownership_conflict"] = True
            parcel["conflict_type"] = issue_type or "ownership_mismatch"
            parcel["source_type"] = "USER_ENTERED"
        else:
            if parcel.get("acquisition_status") == "not_started":
                parcel["acquisition_status"] = "notified"
            parcel["source_type"] = "USER_ENTERED"

        verif_timestamp = datetime.now(timezone.utc).isoformat()
        verif_id = f"VF_{int(datetime.now(timezone.utc).timestamp())}_{pid}"
        verif_record = {
            "verification_id": verif_id,
            "parcel_id": pid,
            "officer_id": officer_id,
            "officer_name": officer_name,
            "verification_type": report.get("verification_type", "field"),
            "status": "rejected" if has_issue else report.get("status", "verified"),
            "verified_at": verif_timestamp,
            "gps_lat": report.get("gps_lat"),
            "gps_lng": report.get("gps_lng"),
            "gps_accuracy": report.get("gps_accuracy"),
            "measured_area_sqm": report.get("measured_area_sqm"),
            "boundary_confirmed": report.get("boundary_confirmed", True),
            "possession_status": report.get("possession_status", "cultivated"),
            "owner_present": report.get("owner_present", True),
            "owner_verified_name": report.get("owner_verified_name"),
            "has_issue": has_issue,
            "issue_type": issue_type,
            "issue_severity": issue_severity,
            "observations": report.get("observations", ""),
            "remarks": report.get("remarks", ""),
            "photos": report.get("photos", []),
            "documents": report.get("documents", []),
            "source_type": "USER_ENTERED",
        }
        self._data_cache.setdefault("verifications", []).append(verif_record)

        if has_issue:
            edge_id_1 = f"E_VERIF_{pid}_{int(datetime.now(timezone.utc).timestamp())}"
            self._data_cache.setdefault("dependency_edges", []).append({
                "edge_id": edge_id_1,
                "from_node_type": "verification",
                "from_node_id": verif_id,
                "to_node_type": "parcel",
                "to_node_id": pid,
                "edge_type": "blocks",
                "weight_days": 35.0,
                "is_blocking": True,
                "source_type": "USER_ENTERED",
            })

            case = next((c for c in self._data_cache.get("acquisition_cases", []) if c.get("parcel_id") == pid), None)
            comp_target = f"CR_{case.get('case_id')}" if case else f"comp_{pid}"
            edge_id_2 = f"E_COMP_{pid}_{int(datetime.now(timezone.utc).timestamp())}"
            self._data_cache.setdefault("dependency_edges", []).append({
                "edge_id": edge_id_2,
                "from_node_type": "parcel",
                "from_node_id": pid,
                "to_node_type": "compensation",
                "to_node_id": comp_target,
                "edge_type": "blocks",
                "weight_days": 30.0,
                "is_blocking": True,
                "source_type": "USER_ENTERED",
            })

        self._enrich_and_compute()

        after_cpm = self._cpm_cache or {}
        after_delay = int(after_cpm.get("project_delay_days", 0))
        delay_delta = max(0, after_delay - before_delay)

        updated_parcel = next((p for p in self._data_cache.get("parcels", []) if p["parcel_id"] == pid), parcel)
        new_risk = float(updated_parcel.get("risk_score") or 0.0)
        new_crit = float(updated_parcel.get("criticality_score") or 0.0)
        is_cp = bool(updated_parcel.get("is_critical_path"))

        log_id = len(self._data_cache.get("audit_logs", [])) + 1
        audit_entry = {
            "log_id": log_id,
            "entity_type": "PARCEL",
            "entity_id": pid,
            "action": "FIELD_ISSUE_REPORTED" if has_issue else "FIELD_VERIFICATION_COMPLETED",
            "actor_id": officer_id,
            "before_value": {"ownership_conflict": old_conflict, "status": old_status},
            "after_value": {
                "ownership_conflict": updated_parcel.get("ownership_conflict"),
                "status": updated_parcel.get("acquisition_status"),
                "issue_type": issue_type,
                "risk_score": new_risk,
                "criticality_score": new_crit,
            },
            "timestamp": verif_timestamp,
            "source_type": "USER_ENTERED",
        }
        self._data_cache.setdefault("audit_logs", []).append(audit_entry)

        notification = {
            "id": f"NOTIF_{int(datetime.now(timezone.utc).timestamp())}",
            "title": f"Field Alert: Parcel {updated_parcel.get('survey_number')} ({issue_type or 'Verified'})",
            "message": (
                f"Field Officer {officer_name} ({officer_id}) reported {issue_type} "
                f"[Severity: {issue_severity}]. Schedule impact delta: +{delay_delta} days. "
                f"Action required: {updated_parcel.get('recommended_action')}"
                if has_issue else
                f"Field Officer {officer_name} successfully verified Parcel {updated_parcel.get('survey_number')}."
            ),
            "urgency": "CRITICAL" if has_issue else "NORMAL",
            "parcel_id": pid,
            "officer_id": officer_id,
            "timestamp": verif_timestamp,
        }

        return {
            "success": True,
            "verification_id": verif_id,
            "parcel_id": pid,
            "status": verif_record["status"],
            "has_issue": has_issue,
            "issue_type": issue_type,
            "updated_risk_score": new_risk,
            "updated_criticality_score": new_crit,
            "is_critical_path": is_cp,
            "cpm_delay_days": after_delay,
            "project_delay_delta_days": delay_delta,
            "projected_finish_date": after_cpm.get("projected_finish_date", "2028-11-15"),
            "recommended_action": updated_parcel.get("recommended_action", "Proceed with statutory process"),
            "audit_log_id": log_id,
            "notification": notification,
            "source_type": "USER_ENTERED",
        }

    def batch_sync_verifications(self, officer_id: str, submissions: list[dict[str, Any]]) -> dict[str, Any]:
        results = []
        synced = 0
        failed = 0
        for sub in submissions:
            try:
                sub["officer_id"] = sub.get("officer_id") or officer_id
                res = self.record_field_verification(sub)
                results.append(res)
                synced += 1
            except Exception as e:
                print(f"[batch_sync_verifications] Failed sub {sub.get('parcel_id')}: {e}")
                failed += 1
        return {
            "success": failed == 0,
            "synced_count": synced,
            "failed_count": failed,
            "results": results,
        }



    def list_field_incidents(
        self,
        officer_id: str | None = None,
        parcel_id: str | None = None,
        status: str | None = None
    ) -> list[dict[str, Any]]:
        if not self._data_cache:
            self._load_data()

        verifs = self._data_cache.get("verifications", [])
        # If cache has no verifications yet, seed a few realistic real-data incidents
        if not verifs:
            parcels = self._data_cache.get("parcels", [])
            p1 = parcels[0]["parcel_id"] if parcels else "P00001"
            p2 = parcels[1]["parcel_id"] if len(parcels) > 1 else "P00002"
            verifs = [
                {
                    "verification_id": "INC-2026-001",
                    "parcel_id": p1,
                    "survey_number": parcels[0].get("survey_number", "101") if parcels else "101",
                    "village_name": "Kanhera Kalan",
                    "project_id": "P-NH927A",
                    "officer_id": "OF001",
                    "officer_name": "Ramesh Meena",
                    "verification_type": "field",
                    "status": "pending",
                    "has_issue": True,
                    "issue_type": "ownership_mismatch",
                    "issue_severity": "HIGH",
                    "observations": "Title record discrepancy found during cadastral inspection. Legal heirs contest mutation.",
                    "remarks": "Assigned to Patwari for on-site physical possession confirmation.",
                    "verified_at": "2026-09-04T10:30:00Z",
                    "gps_lat": 24.6512,
                    "gps_lng": 75.9315,
                    "gps_accuracy": 6.5,
                    "photos": [],
                    "documents": [],
                    "admin_resolution": None,
                    "source_type": "SYNTHETIC / DEVELOPMENT DATA"
                },
                {
                    "verification_id": "INC-2026-002",
                    "parcel_id": p2,
                    "survey_number": parcels[1].get("survey_number", "102") if len(parcels) > 1 else "102",
                    "village_name": "Kanhera Kalan",
                    "project_id": "P-NH927A",
                    "officer_id": "OF002",
                    "officer_name": "Kamla Jat",
                    "verification_type": "field",
                    "status": "confirmed",
                    "has_issue": True,
                    "issue_type": "boundary_discrepancy",
                    "issue_severity": "CRITICAL_STOPPAGE",
                    "observations": "Boundary pillar P-14 shifted by 12 meters into road ROW alignment.",
                    "remarks": "Field surveyor confirmed shift. Demarcation team needed.",
                    "verified_at": "2026-09-05T08:15:00Z",
                    "gps_lat": 24.6525,
                    "gps_lng": 75.9328,
                    "gps_accuracy": 4.2,
                    "photos": [],
                    "documents": [],
                    "admin_resolution": None,
                    "source_type": "SYNTHETIC / DEVELOPMENT DATA"
                }
            ]
            self._data_cache["verifications"] = verifs

        results = verifs
        if officer_id:
            results = [v for v in results if v.get("officer_id") == officer_id]
        if parcel_id:
            results = [v for v in results if v.get("parcel_id") == parcel_id]
        if status:
            results = [v for v in results if v.get("status") == status]
        return results

    def confirm_field_incident(self, incident_id: str, confirmation: dict[str, Any]) -> dict[str, Any]:
        if not self._data_cache:
            self._load_data()

        verifs = self.list_field_incidents()
        inc = next((v for v in verifs if v.get("verification_id") == incident_id), None)
        if not inc:
            raise ValueError(f"Incident {incident_id} not found")

        old_status = inc.get("status")
        new_status = confirmation.get("confirmation_status", "confirmed")
        
        inc["status"] = new_status
        inc["confirmed_at"] = datetime.now(timezone.utc).isoformat()
        inc["confirming_officer_id"] = confirmation.get("officer_id")
        inc["confirming_officer_name"] = confirmation.get("officer_name") or "Field Officer"
        lat = confirmation.get("gps_lat") if confirmation.get("gps_lat") is not None else confirmation.get("gps_latitude")
        lng = confirmation.get("gps_lng") if confirmation.get("gps_lng") is not None else confirmation.get("gps_longitude")
        if lat is not None:
            inc["gps_lat"] = lat
            inc["gps_lng"] = lng
            inc["gps_accuracy"] = confirmation.get("gps_accuracy") or 4.0
        obs = confirmation.get("observations") or confirmation.get("observation_notes")
        if obs:
            inc["observations"] = obs
        if confirmation.get("remarks"):
            inc["remarks"] = confirmation.get("remarks")
        if confirmation.get("photos"):
            inc.setdefault("photos", []).extend(confirmation.get("photos"))
        if confirmation.get("documents"):
            inc.setdefault("documents", []).extend(confirmation.get("documents"))
        inc["source_type"] = "USER_ENTERED"

        # Audit log entry
        log_id = len(self._data_cache.get("audit_logs", [])) + 1
        self._data_cache.setdefault("audit_logs", []).append({
            "log_id": log_id,
            "entity_type": "INCIDENT",
            "entity_id": incident_id,
            "action": "FIELD_INCIDENT_CONFIRMED",
            "actor_id": confirmation.get("officer_id", "FIELD_OFFICER"),
            "before_value": {"status": old_status},
            "after_value": {"status": new_status, "observations": inc.get("observations")},
            "timestamp": inc["confirmed_at"],
            "source_type": "USER_ENTERED"
        })

        return inc

    def resolve_field_incident(
        self,
        incident_id: str,
        admin_id: str,
        resolution_status: str,
        comments: str,
        clear_cpm_blocker: bool = True
    ) -> dict[str, Any]:
        if not self._data_cache:
            self._load_data()

        verifs = self.list_field_incidents()
        inc = next((v for v in verifs if v.get("verification_id") == incident_id), None)
        if not inc:
            raise ValueError(f"Incident {incident_id} not found")

        old_status = inc.get("status")
        now_ts = datetime.now(timezone.utc).isoformat()

        inc["status"] = resolution_status  # resolved | escalated | rejected
        inc["admin_resolution"] = {
            "resolved_by": admin_id,
            "resolved_at": now_ts,
            "action": resolution_status,
            "comments": comments
        }
        inc["source_type"] = "USER_ENTERED"

        pid = inc.get("parcel_id")
        parcel = next((p for p in self._data_cache.get("parcels", []) if p["parcel_id"] == pid), None)

        if resolution_status == "resolved" and clear_cpm_blocker:
            # Clear or unblock dependency edges linked to this verification
            edges = self._data_cache.get("dependency_edges", [])
            for e in edges:
                if e.get("from_node_id") == incident_id:
                    e["is_blocking"] = False
                    e["weight_days"] = 0.0

            if parcel:
                parcel["ownership_conflict"] = False
                parcel["conflict_type"] = "none"

            # Re-run CPM forward/backward passes
            self._enrich_and_compute()

        log_id = len(self._data_cache.get("audit_logs", [])) + 1
        self._data_cache.setdefault("audit_logs", []).append({
            "log_id": log_id,
            "entity_type": "INCIDENT",
            "entity_id": incident_id,
            "action": f"ADMIN_INCIDENT_{resolution_status.upper()}",
            "actor_id": admin_id,
            "before_value": {"status": old_status},
            "after_value": {
                "status": resolution_status,
                "admin_resolution": inc["admin_resolution"]
            },
            "timestamp": now_ts,
            "source_type": "USER_ENTERED"
        })

        after_cpm = self._cpm_cache or {}
        return {
            "incident": inc,
            "parcel_id": pid,
            "resolution_status": resolution_status,
            "cpm_delay_days": int(after_cpm.get("project_delay_days", 0)),
            "projected_finish_date": after_cpm.get("projected_finish", "2028-11-15"),
            "audit_log_id": log_id
        }


sih_service = SIH26016Service()

