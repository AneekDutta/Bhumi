"""
What-If Simulator Engine
Implements Section 12 of SIH26016_Data_Requirements.md.
Deterministic before-vs-after CPM calculation derived from dependency graph mutations.
"""
from copy import deepcopy
from datetime import date
from typing import Any, ClassVar

from app.services.cpm_engine import cpm_engine


class WhatIfSimulator:
    """
    Executes what-if simulations by cloning the graph in memory, mutating edges
    based on administrative interventions, and recomputing the CPM critical path.
    """

    INTERVENTION_COSTS: ClassVar[dict[str, dict[str, Any]]] = {
        "resolve_ownership_conflict": {"officer_days": 14, "cost_inr": 45000, "unit": "Revenue Lok Adalat Hearing"},
        "process_compensation": {"officer_days": 5, "cost_inr": 15000, "unit": "PFMS Direct Treasury Transfer"},
        "complete_field_verification": {"officer_days": 4, "cost_inr": 12000, "unit": "DGPS Cadastral Survey Team"},
        "resolve_legal_case": {"officer_days": 21, "cost_inr": 125000, "unit": "High Court Senior Standing Counsel"},
        "deploy_additional_officers": {"officer_days": 60, "cost_inr": 350000, "unit": "Special Taskforce Influx (3 officers x 20d)"},
        "accelerate_approval": {"officer_days": 3, "cost_inr": 8000, "unit": "Competent Authority Single-Window Desk"},
        "process_rr": {"officer_days": 10, "cost_inr": 50000, "unit": "Social Welfare Resettlement Commission"},
        "RESOLVE_BLOCKER": {"officer_days": 12, "cost_inr": 50000, "unit": "Comprehensive Fast-Track Resolution"}
    }

    def simulate(
        self,
        base_edges: list[dict[str, Any]],
        intervention_type: str,
        target_entity_ids: list[str],
        parcels_lookup: dict[str, dict[str, Any]],
        project_start_date: date | None = None,
        target_completion_date: date | None = None,
        acceleration_factor: float = 1.0
    ) -> dict[str, Any]:
        """
        Runs the deterministic before vs after CPM simulation:
        1. Baseline CPM calculation on original graph
        2. Precondition checking
        3. Mutation of cloned graph
        4. Re-run CPM on mutated graph
        5. Return structured delta diff
        """
        # Step 1: Baseline CPM
        G_before = cpm_engine.build_networkx_graph(base_edges, filter_blocking=True)
        before_result = cpm_engine.compute_cpm_schedule(
            G_before,
            project_start_date=project_start_date,
            base_target_date=target_completion_date
        )

        # Step 2: Validate Preconditions
        preconditions_met = True
        warnings: list[str] = []

        target_set = set(target_entity_ids)
        for pid in target_set:
            pinfo = parcels_lookup.get(pid, {})
            if intervention_type == "process_compensation" and pinfo.get("ownership_conflict"):
                preconditions_met = False
                warnings.append(f"Parcel {pid} has active ownership conflict. Resolution required before compensation.")
            elif intervention_type == "complete_field_verification" and pinfo.get("missing_documents"):
                warnings.append(f"Parcel {pid} has unsubmitted documents; field verification will verify only boundary.")

        # Step 3: Clone Graph in Memory and Apply State Mutations
        G_after = deepcopy(G_before)
        affected_entities: set[str] = set()

        for u, v, data in list(G_after.edges(data=True)):
            # Check if edge relates to target entities
            u_id = u.split(":")[-1]
            v_id = v.split(":")[-1]

            matches_target = u_id in target_set or v_id in target_set

            if matches_target:
                affected_entities.add(u)
                affected_entities.add(v)

                if intervention_type in ["RESOLVE_BLOCKER", "resolve_ownership_conflict"]:
                    # Unblock or zero-out delay weight on blocking edge
                    if data.get("edge_type") in ["blocked_by", "blocks", "requires"]:
                        data["weight"] = 0.0

                elif intervention_type == "process_compensation":
                    if "compensation" in u or "compensation" in v or data.get("edge_type") == "requires":
                        data["weight"] = 0.0

                elif intervention_type == "resolve_legal_case":
                    if "legal_case" in u or "legal_case" in v:
                        data["weight"] = 0.0

                elif intervention_type == "complete_field_verification":
                    if "verification" in u or "verification" in v:
                        data["weight"] = 0.0

                elif intervention_type == "accelerate_approval":
                    if "approval" in u or "approval" in v:
                        data["weight"] = round(data.get("weight", 10.0) * 0.25, 1)

                elif intervention_type == "process_rr" and ("rr_record" in u or "rr_record" in v):
                    data["weight"] = 0.0

            # General acceleration for deploy_additional_officers across all verifications
            if intervention_type == "deploy_additional_officers" and ("verification" in u or "verification" in v):
                factor = max(1.5, acceleration_factor or 2.0)
                data["weight"] = round(data.get("weight", 10.0) / factor, 1)
                affected_entities.add(u)
                affected_entities.add(v)

        # Step 4: Re-run identical CPM algorithm on modified graph
        after_result = cpm_engine.compute_cpm_schedule(
            G_after,
            project_start_date=project_start_date,
            base_target_date=target_completion_date
        )

        # Step 5: Compute Deterministic Difference
        before_days = before_result["total_duration_days"]
        after_days = after_result["total_duration_days"]
        delay_reduction = max(0, round(before_days - after_days))

        cost_info = self.INTERVENTION_COSTS.get(
            intervention_type,
            {"officer_days": 10, "cost_inr": 30000, "unit": "Standard Administrative Action"}
        )
        total_officer_days = cost_info["officer_days"] * max(1, len(target_entity_ids))
        total_cost_inr = cost_info["cost_inr"] * max(1, len(target_entity_ids))

        return {
            "intervention_type": intervention_type,
            "target_entities": list(target_entity_ids),
            "preconditions_met": preconditions_met,
            "precondition_warnings": warnings,
            "before": {
                "project_finish": before_result["projected_finish_date"],
                "project_delay_days": before_result["project_delay_days"],
                "critical_path": [n.split(":")[-1] for n in before_result["critical_path_nodes"] if "parcel:" in n],
                "total_duration_days": before_days
            },
            "after": {
                "project_finish": after_result["projected_finish_date"],
                "project_delay_days": after_result["project_delay_days"],
                "critical_path": [n.split(":")[-1] for n in after_result["critical_path_nodes"] if "parcel:" in n],
                "total_duration_days": after_days
            },
            "delay_reduction_days": delay_reduction,
            "cost_estimate_units": {
                "officer_days": total_officer_days,
                "cost_inr": total_cost_inr,
                "action_unit": cost_info["unit"]
            },
            "affected_entities": [e.split(":")[-1] for e in affected_entities],
            "source_type": "MODEL_DERIVED"
        }


whatif_simulator = WhatIfSimulator()
