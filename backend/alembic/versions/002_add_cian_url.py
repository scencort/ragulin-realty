"""Add cian_url to properties

Revision ID: 002
Revises: 001
Create Date: 2026-06-03
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("properties", sa.Column("cian_url", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("properties", "cian_url")
