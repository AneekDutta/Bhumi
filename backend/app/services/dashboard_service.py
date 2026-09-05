import json
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import TrustedIdentity
from app.models.domain import (
    AcquisitionCase,
    ActivityDependency,
    ActivityParcelRequirement,
    Parcel,
    Project,
    ProjectActivity,
    ProjectSegment,
    Village,
    WorkflowBlocker,
)
from app.services.schedule_engine import ScheduleEngine


class DashboardService:
    def __init__(self, db: AsyncSession, identity: TrustedIdentity):
        self.db = db
        self.identity = identity

    async def _get_authorized_project_ids(self) -> list[UUID]:
        query = select(Project.id)
        if self.identity.assigned_project_id:
            query = query.where(Project.id == UUID(self.identity.assigned_project_id))
        elif self.identity.assigned_district_id:
            # Join through Parcel -> Village -> District
            query = query.join(Parcel, Parcel.project_id == Project.id)\
                         .join(Village, Village.id == Parcel.village_id)\
                         .where(Village.district_id == UUID(self.identity.assigned_district_id))\
                         .distinct()

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_portfolio_summary(self) -> dict[str, Any]:
        projects = await self._get_projects_impact()

        total_projects = len(projects)
        delayed_projects = sum(1 for p in projects if p["project_delay_days"] > 0)
        unresolved_parcels = sum(p["unresolved_parcel_count"] for p in projects)
        total_clusters = sum(p["spatial_cluster_count"] for p in projects)
        critical_path_blocked = sum(1 for p in projects if p["critical_path_blocked"])

        return {
            "total_projects": total_projects,
            "delayed_projects": delayed_projects,
            "unresolved_parcels": unresolved_parcels,
            "total_spatial_clusters": total_clusters,
            "critical_path_blocked_projects": critical_path_blocked
        }

    async def get_projects_impact(self) -> list[dict[str, Any]]:
        return await self._get_projects_impact()

    async def _get_projects_impact(self) -> list[dict[str, Any]]:
        project_ids = await self._get_authorized_project_ids()
        if not project_ids:
            return []

        # 1. Bulk Load Projects
        proj_q = await self.db.execute(select(Project).where(Project.id.in_(project_ids)))
        projects = proj_q.scalars().all()

        # 2. Bulk Load Activities
        act_q = await self.db.execute(select(ProjectActivity).where(ProjectActivity.project_id.in_(project_ids)))
        activities = act_q.scalars().all()
        act_by_proj = {}
        for a in activities:
            act_by_proj.setdefault(a.project_id, []).append(a)

        # 3. Bulk Load Dependencies
        act_ids = [a.id for a in activities]
        deps_by_proj = {}
        if act_ids:
            dep_q = await self.db.execute(select(ActivityDependency).where(ActivityDependency.predecessor_id.in_(act_ids)))
            deps = dep_q.scalars().all()
            # Map dep to project via predecessor
            act_id_to_proj = {a.id: a.project_id for a in activities}
            for d in deps:
                proj_id = act_id_to_proj.get(d.predecessor_id)
                if proj_id:
                    deps_by_proj.setdefault(proj_id, []).append(d)

        # 4. Bulk Load Requirements
        reqs_by_proj = {}
        if act_ids:
            req_q = await self.db.execute(select(ActivityParcelRequirement).where(ActivityParcelRequirement.activity_id.in_(act_ids)))
            reqs = req_q.scalars().all()
            for r in reqs:
                proj_id = act_id_to_proj.get(r.activity_id)
                if proj_id:
                    reqs_by_proj.setdefault(proj_id, []).append(r)

        # 5. Bulk Load Parcels
        parcels_q = await self.db.execute(select(Parcel).where(Parcel.project_id.in_(project_ids)))
        parcels = parcels_q.scalars().all()
        parcels_dict = {p.id: p for p in parcels}
        parcel_ids = [p.id for p in parcels]

        # 6. Bulk Load Cases & Blockers
        cases_by_parcel = {}
        blockers_by_parcel = {}
        if parcel_ids:
            cases_q = await self.db.execute(select(AcquisitionCase).where(AcquisitionCase.parcel_id.in_(parcel_ids)))
            for c in cases_q.scalars().all():
                cases_by_parcel.setdefault(c.parcel_id, []).append(c)

            blockers_q = await self.db.execute(
                select(WorkflowBlocker).where(WorkflowBlocker.parcel_id.in_(parcel_ids), WorkflowBlocker.status == "ACTIVE")
            )
            for b in blockers_q.scalars().all():
                blockers_by_parcel.setdefault(b.parcel_id, []).append(b)

        stage_order = {
            "INITIAL": 0, "PRELIMINARY_NOTIFICATION": 1, "OBJECTIONS": 2,
            "DECLARATION": 3, "AWARD": 4, "COMPENSATION": 5,
            "POSSESSION": 6, "PHYSICAL": 7
        }

        # 7. Spatial Clusters (Bulk compute ST_ClusterDBSCAN)
        # Unresolved definition matching SpatialEngine & ImpactEngine canonically
        unresolved_parcel_ids = set()
        for p in parcels:
            p_cases = cases_by_parcel.get(p.id, [])
            p_blockers = blockers_by_parcel.get(p.id, [])

            is_unresolved = False
            if p_blockers:
                is_unresolved = True
            else:
                for c in p_cases:
                    if c.current_stage != 'POSSESSION' or c.is_lapsed:
                        is_unresolved = True
                        break
            if is_unresolved:
                unresolved_parcel_ids.add(p.id)

        clusters_by_proj = {}
        if unresolved_parcel_ids:
            # PostGIS DBSCAN over unresolved parcels partitioned by project
            cluster_q = select(
                Parcel.project_id,
                func.ST_ClusterDBSCAN(Parcel.geom, 0, 1).over(partition_by=Parcel.project_id).label('cluster_id')
            ).where(Parcel.id.in_(unresolved_parcel_ids)).cte('clusters')

            # Count distinct clusters per project
            count_q = select(
                cluster_q.c.project_id,
                func.count(func.distinct(cluster_q.c.cluster_id)).label('cluster_count')
            ).group_by(cluster_q.c.project_id)

            cluster_results = await self.db.execute(count_q)
            for row in cluster_results.all():
                clusters_by_proj[row.project_id] = row.cluster_count

        # Compute Project Centroids for Map
        centroids_by_proj = {}
        centroid_q = await self.db.execute(
            select(
                ProjectSegment.project_id,
                func.ST_AsGeoJSON(func.ST_Centroid(func.ST_Collect(ProjectSegment.geom))).label('centroid')
            ).where(ProjectSegment.project_id.in_(project_ids)).group_by(ProjectSegment.project_id)
        )
        for row in centroid_q.all():
            if row.centroid:
                centroids_by_proj[row.project_id] = json.loads(row.centroid)

        results = []

        # 8. Orchestrate ScheduleEngine per Project in-memory
        for proj in projects:
            p_acts = act_by_proj.get(proj.id, [])
            p_deps = deps_by_proj.get(proj.id, [])
            p_reqs = reqs_by_proj.get(proj.id, [])

            baseline = ScheduleEngine(datetime.now(timezone.utc))
            current = ScheduleEngine(datetime.now(timezone.utc))

            if not p_acts:
                # Empty project
                continue

            proj_start = min(a.planned_start for a in p_acts)

            for a in p_acts:
                mid = str(a.milestone_id) if a.milestone_id else None
                baseline.add_activity(str(a.id), a.duration_days, a.planned_start, a.name, a.actual_start, a.actual_finish, mid)
                current.add_activity(str(a.id), a.duration_days, a.planned_start, a.name, a.actual_start, a.actual_finish, mid)

            for d in p_deps:
                baseline.add_dependency(str(d.predecessor_id), str(d.successor_id), d.dependency_type)
                current.add_dependency(str(d.predecessor_id), str(d.successor_id), d.dependency_type)

            # Apply Constraints
            project_unresolved_parcels = set()
            highest_urgency = "LOW"

            for req in p_reqs:
                parcel = parcels_dict.get(req.parcel_id)
                if not parcel:
                    continue

                p_cases = cases_by_parcel.get(parcel.id, [])
                p_blockers = blockers_by_parcel.get(parcel.id, [])

                current_stage_idx = 0
                for c in p_cases:
                    idx = stage_order.get(c.current_stage, 0)
                    current_stage_idx = max(current_stage_idx, idx)

                required_stage_idx = stage_order.get(req.required_stage, stage_order["POSSESSION"])

                if current_stage_idx >= required_stage_idx and not p_blockers:
                    # Requirement met, but check if lapsed
                    lapsed = any(c.is_lapsed for c in p_cases)
                    if not lapsed:
                        continue

                project_unresolved_parcels.add(parcel.id)

                delay_days = 0
                if p_blockers:
                    delay_days = p_blockers[0].assumed_resolution_days
                    if highest_urgency != "CRITICAL":
                        highest_urgency = "HIGH"
                elif p_cases:
                    lapsed = any(c.is_lapsed for c in p_cases)
                    if lapsed:
                        delay_days = p_cases[0].assumed_lapse_recovery_days
                        highest_urgency = "CRITICAL"
                    else:
                        delay_days = None

                if delay_days is None or delay_days >= 0:
                    current.add_constraint(str(req.activity_id), str(parcel.id), delay_days)

            baseline_res = baseline.calculate_cpm(proj_start)
            current_res = current.calculate_cpm(proj_start)

            b_finish = baseline_res["project_finish"]
            c_finish = current_res["project_finish"]
            delay = (c_finish - b_finish).days if b_finish and c_finish else 0

            # Identify if critical path blocked
            critical_path_blocked = False
            if current_res["critical_path"]:
                cp_acts = set(current_res["critical_path"])
                for req in p_reqs:
                    if str(req.activity_id) in cp_acts and req.parcel_id in project_unresolved_parcels:
                        critical_path_blocked = True
                        break

            results.append({
                "project_id": proj.id,
                "name": proj.name,
                "state_id": proj.state_id,
                "baseline_finish": b_finish,
                "current_finish": c_finish,
                "project_delay_days": delay,
                "critical_path_blocked": critical_path_blocked,
                "unresolved_parcel_count": len(project_unresolved_parcels),
                "spatial_cluster_count": clusters_by_proj.get(proj.id, 0),
                "highest_urgency": highest_urgency,
                "centroid": centroids_by_proj.get(proj.id)
            })

        return results

    async def get_reports(self, report_type: str) -> list[dict[str, Any]]:
        impacts = await self.get_projects_impact()
        rows = []

        for p in impacts:
            if report_type == "project_status":
                rows.append({
                    "Project ID": str(p["project_id"]),
                    "Project Name": p["name"],
                    "Baseline Finish": p["baseline_finish"].isoformat() if p["baseline_finish"] else "",
                    "Forecast Finish": p["current_finish"].isoformat() if p["current_finish"] else "",
                    "Delay Days": p["project_delay_days"],
                    "Critical Path Blocked": p["critical_path_blocked"],
                    "Unresolved Parcels": p["unresolved_parcel_count"]
                })
            elif report_type == "acquisition_status":
                rows.append({
                    "Project ID": str(p["project_id"]),
                    "Project Name": p["name"],
                    "Unresolved Parcels": p["unresolved_parcel_count"],
                    "Spatial Clusters": p["spatial_cluster_count"],
                    "Urgency Level": p["highest_urgency"]
                })
            elif report_type == "delay_impact":
                rows.append({
                    "Project ID": str(p["project_id"]),
                    "Project Name": p["name"],
                    "Delay Days": p["project_delay_days"],
                    "Critical Path Blocked": p["critical_path_blocked"],
                    "Urgency Level": p["highest_urgency"]
                })
            elif report_type == "critical_blockers":
                rows.append({
                    "Project ID": str(p["project_id"]),
                    "Project Name": p["name"],
                    "Critical Path Blocked": p["critical_path_blocked"],
                    "Unresolved Parcels": p["unresolved_parcel_count"],
                    "Highest Urgency": p["highest_urgency"]
                })
            elif report_type == "spatial_blockage":
                rows.append({
                    "Project ID": str(p["project_id"]),
                    "Project Name": p["name"],
                    "Spatial Clusters": p["spatial_cluster_count"],
                    "Unresolved Parcels": p["unresolved_parcel_count"],
                    "Centroid": json.dumps(p["centroid"]) if p["centroid"] else ""
                })
            elif report_type == "milestone_exposure":
                rows.append({
                    "Project ID": str(p["project_id"]),
                    "Project Name": p["name"],
                    "Delay Days": p["project_delay_days"],
                    "Forecast Finish": p["current_finish"].isoformat() if p["current_finish"] else "",
                })

        return rows
