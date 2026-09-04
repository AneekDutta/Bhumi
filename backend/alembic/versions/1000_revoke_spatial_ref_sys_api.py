"""revoke spatial_ref_sys API exposure

Revision ID: 1000
Revises: 999
Create Date: 2026-09-04 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '1000'
down_revision = "999_add_document_models"
branch_labels = None
depends_on = None

def upgrade() -> None:
    # PostGIS creates spatial_ref_sys with GRANT SELECT TO PUBLIC.
    # This exposes the table via the Supabase Data API to anon/authenticated.
    # We revoke PUBLIC access and explicitly grant only to backend roles.
    op.execute("REVOKE SELECT ON TABLE public.spatial_ref_sys FROM PUBLIC;")
    op.execute("GRANT SELECT ON TABLE public.spatial_ref_sys TO postgres;")
    op.execute("GRANT SELECT ON TABLE public.spatial_ref_sys TO service_role;")

def downgrade() -> None:
    # Revert to default PostGIS behavior
    op.execute("GRANT SELECT ON TABLE public.spatial_ref_sys TO PUBLIC;")
