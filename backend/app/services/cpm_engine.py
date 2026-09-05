"""
CPM (Critical Path Method) and Criticality Scoring Engine
Implements Sections 10, 11, and 12 of SIH26016_Data_Requirements.md.
Deterministic graph-based scheduling, zero-float detection, and prescriptive actions.
"""
from datetime import date, datetime, timedelta, timezone
from typing import Any

import networkx as nx


class CPMEngine:
    """
    Deterministic CPM engine operating on the SIH26016 dependency graph.
    Computes earliest/latest start & finish times, total float, and critical paths.
    """

    def __init__(self):
        self.weights = {
            "w1": 25.0,  # downstream segments
            "w2": 25.0,  # downstream milestones
            "w3": 30.0,  # single point of failure (spof)
            "w4": 20.0,  # incomplete progress fraction
        }

    def build_networkx_graph(self, edges: list[dict[str, Any]], filter_blocking: bool = True) -> nx.DiGraph:
        """Construct a directed graph from dependency_edges."""
        G = nx.DiGraph()
        for e in edges:
            if filter_blocking and not e.get("is_blocking", False):
                continue
            u = f"{e['from_node_type']}:{e['from_node_id']}"
            v = f"{e['to_node_type']}:{e['to_node_id']}"
            weight = float(e.get("weight_days") or 0.0)
            G.add_edge(u, v, weight=weight, edge_type=e.get("edge_type"), edge_id=e.get("edge_id"))
        return G

    def compute_cpm_schedule(
        self,
        G: nx.DiGraph,
        project_start_date: date | None = None,
        base_target_date: date | None = None
    ) -> dict[str, Any]:
        """
        Executes standard CPM forward and backward passes.
        Returns:
            - total_duration_days
            - projected_finish_date
            - project_delay_days
            - critical_path_nodes
            - node_schedules: {node: {ES, EF, LS, LF, float}}
        """
        if G.number_of_nodes() == 0:
            today = datetime.now(timezone.utc).date()
            return {
                "total_duration_days": 0.0,
                "projected_finish_date": today.isoformat(),
                "project_delay_days": 0,
                "critical_path_nodes": [],
                "node_schedules": {}
            }

        # Topological sorting requires a DAG. If cycles exist, break back-edges safely.
        if not nx.is_directed_acyclic_graph(G):
            # Break cycles by removing back-edges
            cycles = list(nx.simple_cycles(G))
            for cycle in cycles:
                if len(cycle) > 1 and G.has_edge(cycle[-1], cycle[0]):
                    G.remove_edge(cycle[-1], cycle[0])

        topo_order = list(nx.topological_sort(G))

        # Forward Pass: Compute Earliest Start (ES) and Earliest Finish (EF)
        es: dict[str, float] = {}
        ef: dict[str, float] = {}

        for node in topo_order:
            preds = list(G.predecessors(node))
            if not preds:
                es[node] = 0.0
            else:
                es[node] = max(ef[p] + G[p][node].get("weight", 0.0) for p in preds)
            # Duration at node is 0 by default; edge weights carry duration in this schema
            ef[node] = es[node]

        total_duration = max(ef.values()) if ef else 0.0

        # Backward Pass: Compute Latest Finish (LF) and Latest Start (LS)
        lf: dict[str, float] = {}
        ls: dict[str, float] = {}

        for node in reversed(topo_order):
            succs = list(G.successors(node))
            if not succs:
                lf[node] = total_duration
            else:
                lf[node] = min(ls[s] - G[node][s].get("weight", 0.0) for s in succs)
            ls[node] = lf[node]

        # Calculate Float and Critical Path (Zero-Float Nodes)
        node_schedules = {}
        critical_nodes = []

        for node in topo_order:
            total_float = round(ls[node] - es[node], 2)
            is_critical = abs(total_float) <= 0.5  # within half a day float
            node_schedules[node] = {
                "ES": es[node],
                "EF": ef[node],
                "LS": ls[node],
                "LF": lf[node],
                "float": total_float,
                "is_critical": is_critical
            }
            if is_critical:
                critical_nodes.append(node)

        # Dates
        start = project_start_date or date(2025, 4, 1)
        projected_finish = start + timedelta(days=int(total_duration))
        target = base_target_date or date(2028, 3, 31)
        delay_days = max(0, (projected_finish - target).days)

        return {
            "total_duration_days": total_duration,
            "projected_finish_date": projected_finish.isoformat(),
            "project_delay_days": delay_days,
            "critical_path_nodes": critical_nodes,
            "node_schedules": node_schedules
        }

    def compute_parcel_criticality_score(
        self,
        parcel_id: str,
        G_full: nx.DiGraph,
        acquisition_status: str,
        is_spof: bool = True
    ) -> tuple[float, dict[str, float]]:
        """
        Computes Parcel Criticality Score according to Section 10 formula:
        score = w1*downstream_segments + w2*downstream_milestones + w3*spof + w4*(1 - progress)
        """
        parcel_node = f"parcel:{parcel_id}"
        downstream_segments = 0
        downstream_milestones = 0

        if parcel_node in G_full:
            descendants = nx.descendants(G_full, parcel_node)
            for d in descendants:
                if d.startswith("project_segment:"):
                    downstream_segments += 1
                elif d.startswith("milestone:"):
                    downstream_milestones += 1

        # Normalized terms (0.0 to 1.0)
        norm_seg = min(1.0, downstream_segments / 4.0) if downstream_segments else 0.25
        norm_ms = min(1.0, downstream_milestones / 2.0) if downstream_milestones else 0.5
        norm_spof = 1.0 if is_spof else 0.0

        stage_progress_map = {
            "possessed": 1.0,
            "compensated": 0.8,
            "award_declared": 0.6,
            "notified": 0.3,
            "not_started": 0.0,
        }
        progress_frac = stage_progress_map.get(acquisition_status, 0.2)
        norm_incomplete = 1.0 - progress_frac

        t1 = self.weights["w1"] * norm_seg
        t2 = self.weights["w2"] * norm_ms
        t3 = self.weights["w3"] * norm_spof
        t4 = self.weights["w4"] * norm_incomplete
        total_score = round(min(100.0, t1 + t2 + t3 + t4), 1)

        breakdown = {
            "w1_downstream_segments": round(t1, 1),
            "w2_downstream_milestones": round(t2, 1),
            "w3_single_point_failure": round(t3, 1),
            "w4_progress_incomplete": round(t4, 1),
            "total_score": total_score
        }
        return total_score, breakdown

    def compute_parcel_risk_score(
        self,
        legal_status: str | None,
        compensation_status: str | None,
        ownership_conflict: bool,
        document_status: str | None,
        criticality_factor: float = 50.0
    ) -> float:
        """
        Computes composite Risk Score (0-100) combining statutory delays & injunctions.
        """
        base_risk = 10.0
        if legal_status == "stayed":
            base_risk += 55.0
        elif legal_status in ["in_hearing", "filed"]:
            base_risk += 35.0

        if compensation_status == "disputed":
            base_risk += 40.0
        elif compensation_status == "pending":
            base_risk += 20.0

        if ownership_conflict:
            base_risk += 35.0

        if document_status in ["missing", "rejected_inconsistent"]:
            base_risk += 30.0
        elif document_status == "under_verification":
            base_risk += 15.0

        # Weighted by parcel criticality factor
        scaled_risk = base_risk * (0.7 + 0.3 * (criticality_factor / 100.0))
        return round(min(100.0, max(5.0, scaled_risk)), 1)

    def generate_recommended_action(
        self,
        legal_status: str | None,
        compensation_status: str | None,
        ownership_conflict: bool,
        conflict_type: str | None,
        document_status: str | None,
        acquisition_status: str
    ) -> str:
        """
        Generates MODEL_DERIVED prescriptive action identifying dominant active blocker.
        """
        if legal_status == "stayed":
            return "Vacate High Court stay order — file urgent counter-affidavit citing public infrastructure purpose under Sec 40."
        if ownership_conflict:
            ctype = conflict_type or "title dispute"
            return f"Convene Revenue Lok Adalat / Tehsildar hearing to resolve {ctype.replace('_', ' ')}."
        if document_status in ["missing", "rejected_inconsistent"]:
            return "Issue statutory Section 15 notice to landholder for immediate submission of missing title deed/jamabandi."
        if compensation_status == "disputed":
            return "Refer valuation dispute to Land Acquisition Authority under Section 64; deposit 100% award into escrow to secure possession."
        if compensation_status == "pending" or acquisition_status == "award_declared":
            return "Fast-track Section 30 award disbursement via PFMS/e-Kuber to prevent interest accumulation under Section 34."
        if acquisition_status == "notified":
            return "Publish Section 19 declaration in official gazette within statutory 12-month lapse limit."
        if acquisition_status == "possessed":
            return "Right-of-way secured and verified — clear for contractor mobilization."
        return "Conduct joint cadastral field verification with Revenue Patwari."


cpm_engine = CPMEngine()
