"""Initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-03 20:00:00.000000

"""
from collections.abc import Sequence

import geoalchemy2
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

def upgrade() -> None:
    # Ensure postgis extension
    op.execute('CREATE EXTENSION IF NOT EXISTS postgis')

    op.create_table('states',
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )

    op.create_table('districts',
    sa.Column('state_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['state_id'], ['states.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('villages',
    sa.Column('district_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['district_id'], ['districts.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('users',
    sa.Column('email', sa.String(), nullable=False),
    sa.Column('full_name', sa.String(), nullable=False),
    sa.Column('role', sa.String(), nullable=False),
    sa.Column('assigned_state_id', postgresql.UUID(as_uuid=True), nullable=True),
    sa.Column('assigned_district_id', postgresql.UUID(as_uuid=True), nullable=True),
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['assigned_district_id'], ['districts.id'], ),
    sa.ForeignKeyConstraint(['assigned_state_id'], ['states.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    op.create_table('projects',
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('total_length_km', sa.Float(), nullable=True),
    sa.Column('state_id', postgresql.UUID(as_uuid=True), nullable=True),
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['state_id'], ['states.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('project_segments',
    sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('start_km', sa.Float(), nullable=True),
    sa.Column('end_km', sa.Float(), nullable=True),
    sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='LINESTRING', srid=4326, from_text='ST_GeomFromEWKT', name='geometry'), nullable=True),
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('milestones',
    sa.Column('segment_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('target_date', sa.DateTime(timezone=True), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['segment_id'], ['project_segments.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('parcels',
    sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('village_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('survey_no', sa.String(), nullable=False),
    sa.Column('area_hectares', sa.Float(), nullable=False),
    sa.Column('classification', sa.String(), nullable=True),
    sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='MULTIPOLYGON', srid=4326, from_text='ST_GeomFromEWKT', name='geometry'), nullable=True),
    sa.Column('possession_type', sa.String(), nullable=True),
    sa.Column('status', sa.String(), nullable=False),
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
    sa.ForeignKeyConstraint(['village_id'], ['villages.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('owners',
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('contact', sa.String(), nullable=True),
    sa.Column('aadhaar_hash', sa.String(), nullable=True),
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('parcel_ownership',
    sa.Column('parcel_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('owner_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('share_pct', sa.Float(), nullable=False),
    sa.Column('is_disputed', sa.Boolean(), nullable=False),
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['owner_id'], ['owners.id'], ),
    sa.ForeignKeyConstraint(['parcel_id'], ['parcels.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('acquisition_cases',
    sa.Column('parcel_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('statutory_act', sa.String(), nullable=False),
    sa.Column('current_stage', sa.String(), nullable=False),
    sa.Column('stage_started_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('computed_deadline', sa.DateTime(timezone=True), nullable=True),
    sa.Column('is_lapsed', sa.Boolean(), nullable=False),
    sa.Column('lapse_risk_flag', sa.Boolean(), nullable=False),
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['parcel_id'], ['parcels.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('statutory_rules',
    sa.Column('rule_code', sa.String(), nullable=False),
    sa.Column('act_code', sa.String(), nullable=False),
    sa.Column('trigger_stage', sa.String(), nullable=False),
    sa.Column('target_stage', sa.String(), nullable=False),
    sa.Column('duration_value', sa.Integer(), nullable=False),
    sa.Column('duration_type', sa.String(), nullable=False),
    sa.Column('warning_threshold_days', sa.Integer(), nullable=False),
    sa.Column('is_hard_lapse', sa.Boolean(), nullable=False),
    sa.Column('statutory_citation', sa.String(), nullable=False),
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_statutory_rules_rule_code'), 'statutory_rules', ['rule_code'], unique=True)

    op.create_table('audit_logs',
    sa.Column('actor_id', sa.String(), nullable=True),
    sa.Column('actor_role', sa.String(), nullable=True),
    sa.Column('action', sa.String(), nullable=False),
    sa.Column('entity_type', sa.String(), nullable=False),
    sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('state_before', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('state_after', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('source', sa.String(), nullable=True),
    sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_index(op.f('ix_statutory_rules_rule_code'), table_name='statutory_rules')
    op.drop_table('statutory_rules')
    op.drop_table('acquisition_cases')
    op.drop_table('parcel_ownership')
    op.drop_table('owners')
    op.drop_table('parcels')
    op.drop_table('milestones')
    op.drop_table('project_segments')
    op.drop_table('projects')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.drop_table('villages')
    op.drop_table('districts')
    op.drop_table('states')
