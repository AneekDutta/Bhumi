"""Dependency Layer

Revision ID: 002_dependency_layer
Revises: 001_initial_schema
Create Date: 2026-09-03 20:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '002_dependency_layer'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table('parcel_segments',
        sa.Column('parcel_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('segment_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('intersection_area_hectares', sa.Float(), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['parcel_id'], ['parcels.id'], ),
        sa.ForeignKeyConstraint(['segment_id'], ['project_segments.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('workflow_blockers',
        sa.Column('parcel_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('blocker_type', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['parcel_id'], ['parcels.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('workflow_blockers')
    op.drop_table('parcel_segments')
