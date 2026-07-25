"""user notification prefs

Revision ID: 005
Revises: 004
Create Date: 2026-07-25
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_notification_prefs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("mode", sa.String(20), nullable=False, server_default="all"),
        sa.Column("toast_popups", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("email_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "browser_notifications",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column("fills", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("partial_fills", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("cancellations", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("rejections", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("placements", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("user_id", name="uq_user_notification_prefs_user_id"),
    )
    op.create_index(
        "ix_user_notification_prefs_user_id",
        "user_notification_prefs",
        ["user_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_user_notification_prefs_user_id",
        table_name="user_notification_prefs",
    )
    op.drop_table("user_notification_prefs")
