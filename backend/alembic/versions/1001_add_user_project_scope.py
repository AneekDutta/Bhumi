"""Add server-side project scope to BHUMI users.

Revision ID: 1001
Revises: 1000
"""
import sqlalchemy as sa

from alembic import op

revision = "1001"
down_revision = "1000"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("assigned_project_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_users_assigned_project_id_projects",
        "users",
        "projects",
        ["assigned_project_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_users_assigned_project_id_projects", "users", type_="foreignkey")
    op.drop_column("users", "assigned_project_id")
