"""Initial schema

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(500), nullable=False),
        sa.Column("role", sa.String(50), nullable=False, server_default="admin"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "properties",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("slug", sa.String(600), nullable=False),
        sa.Column("property_type", sa.Enum("apartment", "house", "commercial", "land", "garage", "townhouse", name="propertytype"), nullable=False),
        sa.Column("status", sa.Enum("sale", "rent", "sold", "rented", name="propertystatus"), nullable=False),
        sa.Column("price", sa.Numeric(15, 2), nullable=False),
        sa.Column("area", sa.Numeric(8, 2), nullable=False),
        sa.Column("rooms", sa.Integer(), nullable=True),
        sa.Column("floor", sa.Integer(), nullable=True),
        sa.Column("total_floors", sa.Integer(), nullable=True),
        sa.Column("address", sa.String(500), nullable=False),
        sa.Column("district", sa.String(200), nullable=False),
        sa.Column("latitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("longitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("advantages", postgresql.JSON(), nullable=True),
        sa.Column("is_featured", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_properties_id", "properties", ["id"])
    op.create_index("ix_properties_slug", "properties", ["slug"], unique=True)

    op.create_table(
        "property_images",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("image_path", sa.String(500), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0"),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_property_images_id", "property_images", ["id"])

    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("client_name", sa.String(200), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("is_published", sa.Boolean(), server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reviews_id", "reviews", ["id"])

    op.create_table(
        "seo_pages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("page", sa.String(100), nullable=False),
        sa.Column("meta_title", sa.String(200), nullable=True),
        sa.Column("meta_description", sa.String(500), nullable=True),
        sa.Column("og_title", sa.String(200), nullable=True),
        sa.Column("og_description", sa.String(500), nullable=True),
        sa.Column("og_image", sa.String(500), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_seo_pages_id", "seo_pages", ["id"])
    op.create_index("ix_seo_pages_page", "seo_pages", ["page"], unique=True)


def downgrade() -> None:
    op.drop_table("seo_pages")
    op.drop_table("reviews")
    op.drop_table("property_images")
    op.drop_table("properties")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS propertytype")
    op.execute("DROP TYPE IF EXISTS propertystatus")
