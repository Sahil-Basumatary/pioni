"""portfolio snapshots

Revision ID: 002
Revises: 001
Create Date: 2026-06-14
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "portfolio_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "portfolio_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("portfolios.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "snapshot_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("total_value", sa.Numeric(20, 2), nullable=False),
        sa.Column("cash_balance", sa.Numeric(20, 2), nullable=False),
        sa.Column("positions_value", sa.Numeric(20, 2), nullable=False),
        sa.Column("total_realized_pnl", sa.Numeric(20, 2), nullable=False),
        sa.Column("total_unrealized_pnl", sa.Numeric(20, 2), nullable=True),
    )
    # Composite index optimized for the common access pattern: "give me snapshots for this
    # portfolio in time order". Postgres can scan the index forward (oldest first) or
    # backward (latest N) without sorting. No standalone snapshot_at index: global queries
    # across all portfolios aren't a use case we plan to support.
    op.create_index(
        "ix_portfolio_snapshots_portfolio_at",
        "portfolio_snapshots",
        ["portfolio_id", "snapshot_at"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_portfolio_snapshots_portfolio_at",
        table_name="portfolio_snapshots",
    )
    op.drop_table("portfolio_snapshots")
