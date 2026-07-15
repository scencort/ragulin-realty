"""add publish flag and badges to properties

Revision ID: 4f2f8f6f8b51
Revises: cf4a36e717b9
Create Date: 2026-07-15 18:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4f2f8f6f8b51"
down_revision: Union[str, None] = "cf4a36e717b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("properties", sa.Column("is_published", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("properties", sa.Column("badges", sa.JSON(), nullable=True))
    op.execute("UPDATE properties SET badges = '[]' WHERE badges IS NULL")
    op.alter_column("properties", "is_published", server_default=None)


def downgrade() -> None:
    op.drop_column("properties", "badges")
    op.drop_column("properties", "is_published")
