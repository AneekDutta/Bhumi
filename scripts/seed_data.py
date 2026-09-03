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
    AcquisitionCase, StatutoryRule, WorkflowStage, DurationType, ParcelSegment, WorkflowBlocker
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
                # 1. State, District, Village
                st = State(id=uuid.uuid4(), name="Maharashtra")
                dt = District(id=uuid.uuid4(), name="Pune", state_id=st.id)
                v1 = Village(id=uuid.uuid4(), name="Village A", district_id=dt.id)
                v2 = Village(id=uuid.uuid4(), name="Village B", district_id=dt.id)
                session.add(st)
                await session.flush()
                session.add(dt)
                await session.flush()
                session.add_all([v1, v2])
                await session.flush()
                
                # 2. Project & Segments
                proj = Project(id=uuid.uuid4(), name="Pune Ring Road Expansion", state_id=st.id, total_length_km=45.0)
                seg1 = ProjectSegment(id=uuid.uuid4(), project_id=proj.id, name="Segment 1 (North)")
                seg2 = ProjectSegment(id=uuid.uuid4(), project_id=proj.id, name="Segment 2 (East)")
                m1 = Milestone(id=uuid.uuid4(), segment_id=seg1.id, name="Earthworks Completion", target_date=datetime(2026, 6, 1, tzinfo=timezone.utc))
                m2 = Milestone(id=uuid.uuid4(), segment_id=seg2.id, name="Foundation Laid", target_date=datetime(2026, 7, 1, tzinfo=timezone.utc))
                session.add(proj)
                await session.flush()
                session.add_all([seg1, seg2])
                await session.flush()
                session.add_all([m1, m2])

                # 3. Statutory Rule
                rule = StatutoryRule(
                    rule_code="RFCTLARR_SEC19_LAPSE", act_code="RFCTLARR_2013", trigger_stage=WorkflowStage.PRELIMINARY_NOTIFICATION.value,
                    target_stage=WorkflowStage.DECLARATION.value, duration_value=12, duration_type=DurationType.MONTHS.value,
                    warning_threshold_days=60, is_hard_lapse=True, statutory_citation="Section 19(7)"
                )
                session.add(rule)
                
                owner = Owner(id=uuid.uuid4(), name="Standard Owner")
                session.add(owner)
                now = datetime.now(timezone.utc)

                p1 = Parcel(id=uuid.uuid4(), project_id=proj.id, village_id=v1.id, survey_no="S1-01", area_hectares=1.0)
                ps1 = ParcelSegment(parcel_id=p1.id, segment_id=seg1.id)
                po1 = ParcelOwnership(parcel_id=p1.id, owner_id=owner.id)
                c1 = AcquisitionCase(id=uuid.uuid4(), parcel_id=p1.id, statutory_act="RFCTLARR_2013", current_stage=WorkflowStage.PRELIMINARY_NOTIFICATION.value, stage_started_at=now - relativedelta(months=13))
                session.add(p1)
                await session.flush()
                session.add_all([ps1, po1, c1])

                p2 = Parcel(id=uuid.uuid4(), project_id=proj.id, village_id=v2.id, survey_no="S2-01", area_hectares=2.5)
                ps2 = ParcelSegment(parcel_id=p2.id, segment_id=seg2.id)
                po2 = ParcelOwnership(parcel_id=p2.id, owner_id=owner.id)
                c2 = AcquisitionCase(id=uuid.uuid4(), parcel_id=p2.id, statutory_act="RFCTLARR_2013", current_stage=WorkflowStage.DECLARATION.value, stage_started_at=now - relativedelta(months=1))
                b2 = WorkflowBlocker(parcel_id=p2.id, blocker_type="HIGH_COURT_STAY", status="ACTIVE", description="Writ petition filed")
                session.add(p2)
                await session.flush()
                session.add_all([ps2, po2, c2, b2])

                p3 = Parcel(id=uuid.uuid4(), project_id=proj.id, village_id=v1.id, survey_no="S1-02", area_hectares=0.5)
                ps3 = ParcelSegment(parcel_id=p3.id, segment_id=seg1.id)
                po3 = ParcelOwnership(parcel_id=p3.id, owner_id=owner.id)
                c3 = AcquisitionCase(id=uuid.uuid4(), parcel_id=p3.id, statutory_act="RFCTLARR_2013", current_stage=WorkflowStage.PRELIMINARY_NOTIFICATION.value, stage_started_at=now - relativedelta(months=11))
                session.add(p3)
                await session.flush()
                session.add_all([ps3, po3, c3])

                p4 = Parcel(id=uuid.uuid4(), project_id=proj.id, village_id=v2.id, survey_no="S-ISOLATED", area_hectares=0.1)
                po4 = ParcelOwnership(parcel_id=p4.id, owner_id=owner.id)
                c4 = AcquisitionCase(id=uuid.uuid4(), parcel_id=p4.id, statutory_act="RFCTLARR_2013", current_stage=WorkflowStage.PRELIMINARY_NOTIFICATION.value, stage_started_at=now - relativedelta(months=2))
                session.add(p4)
                await session.flush()
                session.add_all([po4, c4])

                p5 = Parcel(id=uuid.uuid4(), project_id=proj.id, village_id=v1.id, survey_no="S1-03", area_hectares=4.0)
                ps5 = ParcelSegment(parcel_id=p5.id, segment_id=seg1.id)
                po5 = ParcelOwnership(parcel_id=p5.id, owner_id=owner.id)
                c5 = AcquisitionCase(id=uuid.uuid4(), parcel_id=p5.id, statutory_act="RFCTLARR_2013", current_stage=WorkflowStage.POSSESSION.value, stage_started_at=now - relativedelta(months=2))
                session.add(p5)
                await session.flush()
                session.add_all([ps5, po5, c5])
                
                await session.flush()
            else:
                print("Project found, using existing Phase 1/2 data...")
                # Fetch segments, parcels, milestones
                seg1 = (await session.execute(select(ProjectSegment).filter_by(project_id=proj.id, name="Segment 1 (North)"))).scalars().first()
                seg2 = (await session.execute(select(ProjectSegment).filter_by(project_id=proj.id, name="Segment 2 (East)"))).scalars().first()
                m1 = (await session.execute(select(Milestone).filter_by(segment_id=seg1.id))).scalars().first()
                p1 = (await session.execute(select(Parcel).filter_by(project_id=proj.id, survey_no="S1-01"))).scalars().first()
                p2 = (await session.execute(select(Parcel).filter_by(project_id=proj.id, survey_no="S2-01"))).scalars().first()
                p5 = (await session.execute(select(Parcel).filter_by(project_id=proj.id, survey_no="S1-03"))).scalars().first()
            
            
            # Update/Ensure deterministic quantified assumptions on p1 and p2
            c1_q = await session.execute(select(AcquisitionCase).filter_by(parcel_id=p1.id))
            c1 = c1_q.scalars().first()
            if c1:
                c1.is_lapsed = True
                c1.assumed_lapse_recovery_days = 20
                c1.current_stage = WorkflowStage.PRELIMINARY_NOTIFICATION.value

            c2_q = await session.execute(select(AcquisitionCase).filter_by(parcel_id=p2.id))
            c2 = c2_q.scalars().first()
            if c2:
                c2.current_stage = WorkflowStage.DECLARATION.value

            b2_q = await session.execute(select(WorkflowBlocker).filter_by(parcel_id=p2.id))
            b2 = b2_q.scalars().first()
            if b2:
                b2.status = "ACTIVE"
                b2.blocker_type = "HIGH_COURT_STAY"
                b2.assumed_resolution_days = 15
            else:
                b2 = WorkflowBlocker(
                    parcel_id=p2.id,
                    blocker_type="HIGH_COURT_STAY",
                    status="ACTIVE",
                    description="Writ petition filed",
                    assumed_resolution_days=15
                )
                session.add(b2)
            await session.flush()

            # --- PHASE 3: Idempotent Golden Scenario ---
            print("Cleaning old Phase 3 data...")
            # We delete activity reqs and dependencies first because of foreign keys
            from app.models.domain import ProjectActivity, ActivityDependency, ActivityParcelRequirement
            
            # Subquery to get project activity ids
            act_ids = select(ProjectActivity.id).filter_by(project_id=proj.id)
            
            await session.execute(delete(ActivityParcelRequirement).where(ActivityParcelRequirement.activity_id.in_(act_ids)))
            await session.execute(delete(ActivityDependency).where(ActivityDependency.predecessor_id.in_(act_ids)))
            await session.execute(delete(ActivityDependency).where(ActivityDependency.successor_id.in_(act_ids)))
            await session.execute(delete(ProjectActivity).where(ProjectActivity.project_id == proj.id))
            await session.flush()

            print("Seeding Phase 3 Golden Scenario...")
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
            
            # p1 is the lapsed case (Golden Bottleneck on Critical Path)
            req1 = ActivityParcelRequirement(activity_id=a1.id, parcel_id=p1.id, required_stage=WorkflowStage.POSSESSION.value)
            
            # p2 is the High Court Stay (Parallel/Float path, uncritical)
            req2 = ActivityParcelRequirement(activity_id=a4.id, parcel_id=p2.id, required_stage=WorkflowStage.POSSESSION.value)
            
            # p5 is resolved (No impact)
            req3 = ActivityParcelRequirement(activity_id=a2.id, parcel_id=p5.id, required_stage=WorkflowStage.POSSESSION.value)
            
            session.add_all([req1, req2, req3])
            
            await session.commit()
            print(f"Seed Data Committed! Project ID: {proj.id}")
            
        except Exception as e:
            await session.rollback()
            print(f"Seed failed: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(seed_all())
