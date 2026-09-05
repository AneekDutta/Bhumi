"""phase 3 schedule

Revision ID: 7a0000000000
Revises: 002_dependency_layer
Create Date: 2026-09-03 21:55:00.000000

"""
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = '7a0000000000'
down_revision = '002_dependency_layer'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'project_activities',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('segment_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('milestone_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('duration_days', sa.Integer(), nullable=False),
        sa.Column('planned_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('planned_finish', sa.DateTime(timezone=True), nullable=False),
        sa.Column('actual_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('actual_finish', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='PLANNED'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['milestone_id'], ['milestones.id'], ),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.ForeignKeyConstraint(['segment_id'], ['project_segments.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_project_activities_project_id'), 'project_activities', ['project_id'], unique=False)

    op.create_table(
        'activity_dependencies',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('predecessor_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('successor_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('dependency_type', sa.String(), nullable=False, server_default='FINISH_TO_START'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['predecessor_id'], ['project_activities.id'], ),
        sa.ForeignKeyConstraint(['successor_id'], ['project_activities.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_activity_dependencies_predecessor_id'), 'activity_dependencies', ['predecessor_id'], unique=False)
    op.create_index(op.f('ix_activity_dependencies_successor_id'), 'activity_dependencies', ['successor_id'], unique=False)

    op.create_table(
        'activity_parcel_requirements',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('activity_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('parcel_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('required_stage', sa.String(), nullable=False, server_default='POSSESSION'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['activity_id'], ['project_activities.id'], ),
        sa.ForeignKeyConstraint(['parcel_id'], ['parcels.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_activity_parcel_requirements_activity_id'), 'activity_parcel_requirements', ['activity_id'], unique=False)
    op.create_index(op.f('ix_activity_parcel_requirements_parcel_id'), 'activity_parcel_requirements', ['parcel_id'], unique=False)

    op.add_column('workflow_blockers', sa.Column('assumed_resolution_days', sa.Integer(), nullable=True))
    op.add_column('acquisition_cases', sa.Column('assumed_lapse_recovery_days', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('acquisition_cases', 'assumed_lapse_recovery_days')
    op.drop_column('workflow_blockers', 'assumed_resolution_days')
    
    op.drop_index(op.f('ix_activity_parcel_requirements_parcel_id'), table_name='activity_parcel_requirements')
    op.drop_index(op.f('ix_activity_parcel_requirements_activity_id'), table_name='activity_parcel_requirements')
    op.drop_table('activity_parcel_requirements')
    
    op.drop_index(op.f('ix_activity_dependencies_successor_id'), table_name='activity_dependencies')
    op.drop_index(op.f('ix_activity_dependencies_predecessor_id'), table_name='activity_dependencies')
    op.drop_table('activity_dependencies')
    
    op.drop_index(op.f('ix_project_activities_project_id'), table_name='project_activities')
    op.drop_table('project_activities')
