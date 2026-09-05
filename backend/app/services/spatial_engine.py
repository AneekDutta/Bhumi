import json
from typing import Any
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import (
    AcquisitionCase,
    Parcel,
    ProjectActivity,
    ProjectSegment,
    WorkflowBlocker,
)
from app.services.impact_engine import ImpactEngine


class SpatialEngine:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_clusters(self, project_id: UUID) -> list[dict[str, Any]]:
        """
        Derives connected clusters of unresolved parcels using ST_ClusterDBSCAN(eps=0)
        which acts as a topological 'touches' or 'intersects' grouping.
        """
        impact_engine = ImpactEngine(self.db)
        await impact_engine.load_project(project_id)
        
        unresolved_parcel_ids = []
        
        # Fetch all active blockers for the project
        blockers_q = await self.db.execute(
            select(WorkflowBlocker.parcel_id)
            .join(Parcel, Parcel.id == WorkflowBlocker.parcel_id)
            .where(Parcel.project_id == project_id, WorkflowBlocker.status == 'ACTIVE')
        )
        blocked_parcel_ids = set(blockers_q.scalars().all())

        # Fetch all unresolved cases (not POSSESSION or is_lapsed)
        cases_q = await self.db.execute(
            select(AcquisitionCase.parcel_id)
            .join(Parcel, Parcel.id == AcquisitionCase.parcel_id)
            .where(
                Parcel.project_id == project_id,
                (AcquisitionCase.current_stage != 'POSSESSION') | (AcquisitionCase.is_lapsed == True)
            )
        )
        unresolved_case_parcel_ids = set(cases_q.scalars().all())

        unresolved_parcel_ids = list(blocked_parcel_ids.union(unresolved_case_parcel_ids))
                
        if not unresolved_parcel_ids:
            return []

        # eps=0 groups geometries that touch or intersect
        cluster_query = select(
            Parcel.id,
            Parcel.survey_no,
            func.ST_ClusterDBSCAN(Parcel.geom, 0, 1).over().label('cluster_id')
        ).where(
            and_(
                Parcel.project_id == project_id,
                Parcel.id.in_(unresolved_parcel_ids)
            )
        ).cte('parcel_clusters')

        grouped_clusters = select(
            cluster_query.c.cluster_id,
            func.ST_Union(Parcel.geom).label('geom'),
            func.array_agg(cluster_query.c.id).label('parcel_ids'),
            func.array_agg(cluster_query.c.survey_no).label('survey_nos')
        ).join(
            Parcel, Parcel.id == cluster_query.c.id
        ).group_by(
            cluster_query.c.cluster_id
        ).cte('grouped_clusters')

        intersection_query = select(
            grouped_clusters.c.cluster_id,
            grouped_clusters.c.parcel_ids,
            grouped_clusters.c.survey_nos,
            func.ST_AsGeoJSON(grouped_clusters.c.geom).label('geojson'),
            ProjectSegment.id.label('segment_id'),
            ProjectSegment.name.label('segment_name')
        ).join(
            ProjectSegment,
            func.ST_Intersects(grouped_clusters.c.geom, ProjectSegment.geom)
        ).where(
            ProjectSegment.project_id == project_id
        )

        result = await self.db.execute(intersection_query)
        rows = result.all()

        clusters = []
        for row in rows:
            cluster_data = {
                "cluster_id": row.cluster_id,
                "parcel_ids": [str(pid) for pid in row.parcel_ids],
                "survey_nos": row.survey_nos,
                "segment": {
                    "id": str(row.segment_id),
                    "name": row.segment_name
                },
                "geometry": json.loads(row.geojson) if row.geojson else None,
                "activities": []
            }
            
            act_q = await self.db.execute(
                select(ProjectActivity)
                .where(ProjectActivity.segment_id == row.segment_id)
            )
            activities = act_q.scalars().all()
            
            # We must run analyze_impact to populate bottlenecks
            impact_results = impact_engine.analyze_impact()

            for act in activities:
                act_id_str = str(act.id)
                # Find if this activity is a bottleneck due to ANY parcel in this cluster
                delay = 0
                causal = []
                
                # We check the actual result bottlenecks which have causal_path
                for b in impact_results.get("bottlenecks", []):
                    # Check if the bottleneck's affected activity matches
                    # The bottleneck affects a parcel. Is that parcel in our cluster?
                    if b.get("parcel_id") in cluster_data["parcel_ids"]:
                        # Is this activity in the affected activities of this parcel?
                        evidence = impact_engine.bottleneck_evidence.get(b.get("parcel_id"))
                        if evidence and act_id_str in evidence["affected_activities"]:
                            delay = b.get("delay_days", 0)
                            # Causal path is a list of dicts or strings. Let's just grab the nodes.
                            c_path = b.get("causal_path", [])
                            if c_path and isinstance(c_path[0], dict):
                                causal = [p.get("node", str(p)) for p in c_path]
                            else:
                                causal = [str(p) for p in c_path]
                            break
                            
                cluster_data["activities"].append({
                    "activity_id": act_id_str,
                    "activity_name": act.name,
                    "delay_days": delay,
                    "causal_path": causal
                })
            
            clusters.append(cluster_data)

        return clusters

    async def get_project_geojson(self, project_id: UUID) -> dict[str, Any]:
        seg_q = await self.db.execute(
            select(
                ProjectSegment.id, 
                ProjectSegment.name, 
                func.ST_AsGeoJSON(ProjectSegment.geom).label('geojson')
            ).where(ProjectSegment.project_id == project_id)
        )
        
        segments_features = []
        for row in seg_q.all():
            if row.geojson:
                feat = {
                    "type": "Feature",
                    "geometry": json.loads(row.geojson),
                    "properties": {
                        "id": str(row.id),
                        "name": row.name,
                        "type": "segment"
                    }
                }
                segments_features.append(feat)

        impact_engine = ImpactEngine(self.db)
        await impact_engine.load_project(project_id)

        parcels_q = await self.db.execute(
            select(
                Parcel.id, 
                Parcel.survey_no, 
                func.ST_AsGeoJSON(Parcel.geom).label('geojson')
            ).where(Parcel.project_id == project_id)
        )
        
        parcels_features = []
        # Fetch unresolved parcels directly
        blockers_q = await self.db.execute(select(WorkflowBlocker.parcel_id).join(Parcel).where(Parcel.project_id == project_id, WorkflowBlocker.status == 'ACTIVE'))
        blocked_parcel_ids = set(blockers_q.scalars().all())
        cases_q = await self.db.execute(select(AcquisitionCase.parcel_id).join(Parcel).where(Parcel.project_id == project_id, (AcquisitionCase.current_stage != 'POSSESSION') | (AcquisitionCase.is_lapsed == True)))
        unresolved_case_parcel_ids = set(cases_q.scalars().all())
        unresolved_ids = blocked_parcel_ids.union(unresolved_case_parcel_ids)

        for row in parcels_q.all():
            if row.geojson:
                is_unresolved = row.id in unresolved_ids

                feat = {
                    "type": "Feature",
                    "geometry": json.loads(row.geojson),
                    "properties": {
                        "id": str(row.id),
                        "survey_no": row.survey_no,
                        "type": "parcel",
                        "status": "UNRESOLVED" if is_unresolved else "RESOLVED"
                    }
                }
                parcels_features.append(feat)

        return {
            "segments": {
                "type": "FeatureCollection",
                "features": segments_features
            },
            "parcels": {
                "type": "FeatureCollection",
                "features": parcels_features
            }
        }
