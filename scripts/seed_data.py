import asyncio
import uuid
import sys
import os
from datetime import datetime, timezone, timedelta
from dateutil.relativedelta import relativedelta

sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.core.database import AsyncSessionLocal
from app.models.domain import (
    State, District, Village, Project, ProjectSegment, Milestone, Parcel, Owner, ParcelOwnership,
    AcquisitionCase, StatutoryRule, WorkflowStage, DurationType, ParcelSegment, WorkflowBlocker,
    ProjectActivity, ActivityDependency, ActivityParcelRequirement
)
from sqlalchemy import select, delete

async def seed_all():
    async with AsyncSessionLocal() as session:
        try:
            # Check if project exists
            proj_result = await session.execute(select(Project).filter_by(name="Pune Ring Road Expansion"))
            proj = proj_result.scalars().first()
            
            if not proj:
                print("Creating Phase 1/2 Data...")
                st = State(id=uuid.uuid4(), name="Maharashtra")
                dt = District(id=uuid.uuid4(), name="Pune", state_id=st.id)
                v1 = Village(id=uuid.uuid4(), name="Village A", district_id=dt.id)
                v2 = Village(id=uuid.uuid4(), name="Village B", district_id=dt.id)
                session.add_all([st, dt, v1, v2])
                await session.flush()
                
                proj = Project(id=uuid.uuid4(), name="Pune Ring Road Expansion", state_id=st.id, total_length_km=45.0)
                seg1 = ProjectSegment(id=uuid.uuid4(), project_id=proj.id, name="Segment 1 (North)")
                seg2 = ProjectSegment(id=uuid.uuid4(), project_id=proj.id, name="Segment 2 (East)")
                m1 = Milestone(id=uuid.uuid4(), segment_id=seg1.id, name="Earthworks Completion", target_date=datetime(2026, 6, 1, tzinfo=timezone.utc))
                m2 = Milestone(id=uuid.uuid4(), segment_id=seg2.id, name="Foundation Laid", target_date=datetime(2026, 7, 1, tzinfo=timezone.utc))
                session.add_all([proj, seg1, seg2, m1, m2])

                rule = StatutoryRule(
                    rule_code="RFCTLARR_SEC19_LAPSE", act_code="RFCTLARR_2013", trigger_stage=WorkflowStage.PRELIMINARY_NOTIFICATION.value,
                    target_stage=WorkflowStage.DECLARATION.value, duration_value=12, duration_type=DurationType.MONTHS.value,
                    warning_threshold_days=60, is_hard_lapse=True, statutory_citation="Section 19(7)"
                )
                owner = Owner(id=uuid.uuid4(), name="Standard Owner")
                session.add_all([rule, owner])
                await session.flush()
            else:
                print("Project found, using existing Phase 1/2 data...")
                seg1 = (await session.execute(select(ProjectSegment).filter_by(project_id=proj.id, name="Segment 1 (North)"))).scalars().first()
                seg2 = (await session.execute(select(ProjectSegment).filter_by(project_id=proj.id, name="Segment 2 (East)"))).scalars().first()
                m1 = (await session.execute(select(Milestone).filter_by(segment_id=seg1.id))).scalars().first()
                owner = (await session.execute(select(Owner).filter_by(name="Standard Owner"))).scalars().first()
                v1 = (await session.execute(select(Village).filter_by(name="Village A"))).scalars().first()
                v2 = (await session.execute(select(Village).filter_by(name="Village B"))).scalars().first()

            # Assign Geometries to Segments (Phase 4)
            seg1.geom = "SRID=4326;LINESTRING(73.80 18.50, 73.90 18.50)"
            seg2.geom = "SRID=4326;LINESTRING(73.90 18.50, 74.00 18.50)"
            await session.flush()

            # Drop old parcels and dependents to ensure clean Phase 4 Golden Scenario
            print("Cleaning old parcels and cases...")
            await session.execute(delete(ActivityParcelRequirement))
            await session.execute(delete(AcquisitionCase))
            await session.execute(delete(WorkflowBlocker))
            await session.execute(delete(ParcelSegment))
            await session.execute(delete(ParcelOwnership))
            await session.execute(delete(Parcel))
            await session.flush()

            now = datetime.now(timezone.utc)

            print("Seeding Phase 4 Parcels (Geometries)...")
            
            # S1-01 (Unresolved, intersects Seg1, touches S1-02)
            p1 = Parcel(id=uuid.uuid4(), project_id=proj.id, village_id=v1.id, survey_no="S1-01", area_hectares=1.0, geom="SRID=4326;MULTIPOLYGON(((73.81 18.49, 73.81 18.51, 73.82 18.51, 73.82 18.49, 73.81 18.49)))")
            c1 = AcquisitionCase(id=uuid.uuid4(), parcel_id=p1.id, statutory_act="RFCTLARR_2013", current_stage=WorkflowStage.PRELIMINARY_NOTIFICATION.value, stage_started_at=now - relativedelta(months=14), is_lapsed=True, assumed_lapse_recovery_days=20)
            
            # S1-02 (Unresolved, intersects Seg1, touches S1-01 and S1-03)
            p2 = Parcel(id=uuid.uuid4(), project_id=proj.id, village_id=v1.id, survey_no="S1-02", area_hectares=1.0, geom="SRID=4326;MULTIPOLYGON(((73.82 18.49, 73.82 18.51, 73.83 18.51, 73.83 18.49, 73.82 18.49)))")
            c2 = AcquisitionCase(id=uuid.uuid4(), parcel_id=p2.id, statutory_act="RFCTLARR_2013", current_stage=WorkflowStage.PRELIMINARY_NOTIFICATION.value, stage_started_at=now - relativedelta(months=1))
            
            # S1-03 (Unresolved, intersects Seg1, touches S1-02) - forms the 3-parcel contiguous cluster A->B->C
            p3 = Parcel(id=uuid.uuid4(), project_id=proj.id, village_id=v1.id, survey_no="S1-03", area_hectares=1.0, geom="SRID=4326;MULTIPOLYGON(((73.83 18.49, 73.83 18.51, 73.84 18.51, 73.84 18.49, 73.83 18.49)))")
            c3 = AcquisitionCase(id=uuid.uuid4(), parcel_id=p3.id, statutory_act="RFCTLARR_2013", current_stage=WorkflowStage.DECLARATION.value, stage_started_at=now - relativedelta(months=1))
            
            # S1-04 (Resolved, intersects Seg1, but EXCLUDED from cluster)
            p4 = Parcel(id=uuid.uuid4(), project_id=proj.id, village_id=v1.id, survey_no="S1-04", area_hectares=1.0, geom="SRID=4326;MULTIPOLYGON(((73.85 18.49, 73.85 18.51, 73.86 18.51, 73.86 18.49, 73.85 18.49)))")
            c4 = AcquisitionCase(id=uuid.uuid4(), parcel_id=p4.id, statutory_act="RFCTLARR_2013", current_stage=WorkflowStage.POSSESSION.value, stage_started_at=now - relativedelta(months=2))
            
            # S2-01 (Unresolved, intersects Seg2, ISOLATED)
            p5 = Parcel(id=uuid.uuid4(), project_id=proj.id, village_id=v2.id, survey_no="S2-01", area_hectares=1.0, geom="SRID=4326;MULTIPOLYGON(((73.95 18.49, 73.95 18.51, 73.96 18.51, 73.96 18.49, 73.95 18.49)))")
            c5 = AcquisitionCase(id=uuid.uuid4(), parcel_id=p5.id, statutory_act="RFCTLARR_2013", current_stage=WorkflowStage.DECLARATION.value, stage_started_at=now - relativedelta(months=1))
            b5 = WorkflowBlocker(parcel_id=p5.id, blocker_type="HIGH_COURT_STAY", status="ACTIVE", description="Writ petition filed", assumed_resolution_days=15)

            session.add_all([p1, p2, p3, p4, p5])
            await session.flush()
            
            # Ownerships & Segments mapping
            for p in [p1, p2, p3, p4]:
                session.add(ParcelOwnership(parcel_id=p.id, owner_id=owner.id))
                session.add(ParcelSegment(parcel_id=p.id, segment_id=seg1.id))
            
            session.add(ParcelOwnership(parcel_id=p5.id, owner_id=owner.id))
            session.add(ParcelSegment(parcel_id=p5.id, segment_id=seg2.id))
            
            session.add_all([c1, c2, c3, c4, c5, b5])
            await session.flush()

            # --- PHASE 3: Idempotent Golden Scenario ---
            print("Cleaning old Phase 3 Schedule data...")
            act_ids = select(ProjectActivity.id).filter_by(project_id=proj.id)
            await session.execute(delete(ActivityParcelRequirement).where(ActivityParcelRequirement.activity_id.in_(act_ids)))
            await session.execute(delete(ActivityDependency).where(ActivityDependency.predecessor_id.in_(act_ids)))
            await session.execute(delete(ActivityDependency).where(ActivityDependency.successor_id.in_(act_ids)))
            await session.execute(delete(ProjectActivity).where(ProjectActivity.project_id == proj.id))
            await session.flush()

            print("Seeding Phase 3 Golden Schedule...")
            start_date = datetime(2026, 1, 1, tzinfo=timezone.utc)
            
            a1 = ProjectActivity(id=uuid.uuid4(), project_id=proj.id, segment_id=seg1.id, name="A1: Land Clearing", duration_days=10, planned_start=start_date, planned_finish=start_date + timedelta(days=10))
            a2 = ProjectActivity(id=uuid.uuid4(), project_id=proj.id, segment_id=seg1.id, name="A2: Earthworks", duration_days=15, planned_start=start_date + timedelta(days=10), planned_finish=start_date + timedelta(days=25))
            a3 = ProjectActivity(id=uuid.uuid4(), project_id=proj.id, segment_id=seg1.id, name="A3: Paving", duration_days=10, planned_start=start_date + timedelta(days=25), planned_finish=start_date + timedelta(days=35), milestone_id=m1.id)
            a4 = ProjectActivity(id=uuid.uuid4(), project_id=proj.id, segment_id=seg2.id, name="A4: Utility Relocation", duration_days=5, planned_start=start_date, planned_finish=start_date + timedelta(days=5))

            session.add_all([a1, a2, a3, a4])
            await session.flush()

            d1 = ActivityDependency(predecessor_id=a1.id, successor_id=a2.id)
            d2 = ActivityDependency(predecessor_id=a2.id, successor_id=a3.id)
            session.add_all([d1, d2])
            
            # Map unresolved cluster parcels (p1, p2, p3) to A1
            req1 = ActivityParcelRequirement(activity_id=a1.id, parcel_id=p1.id, required_stage=WorkflowStage.POSSESSION.value)
            req2 = ActivityParcelRequirement(activity_id=a1.id, parcel_id=p2.id, required_stage=WorkflowStage.POSSESSION.value)
            req3 = ActivityParcelRequirement(activity_id=a1.id, parcel_id=p3.id, required_stage=WorkflowStage.POSSESSION.value)
            
            # p4 is resolved
            req4 = ActivityParcelRequirement(activity_id=a2.id, parcel_id=p4.id, required_stage=WorkflowStage.POSSESSION.value)
            
            # p5 is the High Court Stay on parallel path A4
            req5 = ActivityParcelRequirement(activity_id=a4.id, parcel_id=p5.id, required_stage=WorkflowStage.POSSESSION.value)
            
            session.add_all([req1, req2, req3, req4, req5])
            
            await session.commit()
            print(f"Seed Data Committed! Project ID: {proj.id}")
            
        except Exception as e:
            await session.rollback()
            print(f"Seed failed: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(seed_all())
