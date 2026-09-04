"""Add document models

Revision ID: 999_add_document_models
Revises: ee91fe35a1b6
Create Date: 2026-09-04 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '999_add_document_models'
down_revision: Union[str, None] = 'ee91fe35a1b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('documents',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('project_id', sa.UUID(), nullable=True),
    sa.Column('parcel_id', sa.UUID(), nullable=True),
    sa.Column('acquisition_case_id', sa.UUID(), nullable=True),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('document_type', sa.String(), nullable=False),
    sa.Column('current_version', sa.Integer(), nullable=False),
    sa.Column('status', sa.String(), nullable=False),
    sa.ForeignKeyConstraint(['acquisition_case_id'], ['acquisition_cases.id'], ),
    sa.ForeignKeyConstraint(['parcel_id'], ['parcels.id'], ),
    sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('document_versions',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('document_id', sa.UUID(), nullable=False),
    sa.Column('version_number', sa.Integer(), nullable=False),
    sa.Column('storage_path', sa.String(), nullable=False),
    sa.Column('original_filename', sa.String(), nullable=False),
    sa.Column('mime_type', sa.String(), nullable=False),
    sa.Column('size_bytes', sa.Integer(), nullable=False),
    sa.Column('sha256_hash', sa.String(), nullable=False),
    sa.Column('uploaded_by_id', sa.String(), nullable=False),
    sa.Column('uploaded_by_role', sa.String(), nullable=False),
    sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('document_versions')
    op.drop_table('documents')
