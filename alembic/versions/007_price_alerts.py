"""price alerts for user market notifications

Revision ID: 007
Revises: 006
Create Date: 2026-07-27
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

price_alert_condition = postgresql.ENUM(
    "ABOVE", "BELOW", name="price_alert_condition", create_type=False,
)
price_alert_status = postgresql.ENUM(
    "ACTIVE", "TRIGGERED", "CANCELLED", name="price_alert_status", create_type=False,
)


def upgrade() -> None:
    price_alert_condition.create(op.get_bind(), checkfirst=True)
    price_alert_status.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "price_alerts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("symbol", sa.String(20), nullable=False),
        sa.Column(
            "condition",
            price_alert_condition,
            nullable=False,
        ),
        sa.Column("target_price", sa.Numeric(20, 8), nullable=False),
        sa.Column(
            "status",
            price_alert_status,
            nullable=False,
            server_default="ACTIVE",
        ),
        sa.Column("triggered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("trigger_price", sa.Numeric(20, 8), nullable=True),
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
    )
    op.create_index("ix_price_alerts_user_id", "price_alerts", ["user_id"])
    op.create_index("ix_price_alerts_status", "price_alerts", ["status"])
    op.create_index(
        "ix_price_alerts_user_status", "price_alerts", ["user_id", "status"],
    )
    op.create_index(
        "ix_price_alerts_user_symbol", "price_alerts", ["user_id", "symbol"],
    )


def downgrade() -> None:
    op.drop_index("ix_price_alerts_user_symbol", table_name="price_alerts")
    op.drop_index("ix_price_alerts_user_status", table_name="price_alerts")
    op.drop_index("ix_price_alerts_status", table_name="price_alerts")
    op.drop_index("ix_price_alerts_user_id", table_name="price_alerts")
    op.drop_table("price_alerts")
    price_alert_status.drop(op.get_bind(), checkfirst=True)
    price_alert_condition.drop(op.get_bind(), checkfirst=True)
