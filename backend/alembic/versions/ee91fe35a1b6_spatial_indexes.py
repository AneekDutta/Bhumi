"""spatial_indexes

Revision ID: ee91fe35a1b6
Revises: 7a0000000000
Create Date: 2026-09-04 00:33:18.687621

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ee91fe35a1b6'
down_revision: Union[str, Sequence[str], None] = '7a0000000000'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("CREATE INDEX IF NOT EXISTS idx_parcels_geom ON parcels USING GIST (geom)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_segments_geom ON project_segments USING GIST (geom)")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP INDEX IF EXISTS idx_parcels_geom")
    op.execute("DROP INDEX IF EXISTS idx_segments_geom")
