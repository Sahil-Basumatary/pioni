"""ledger entries for portfolio balance history

Revision ID: 006
Revises: 005
Create Date: 2026-07-26
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ledger_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "portfolio_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("portfolios.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("trade_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("entry_type", sa.String(32), nullable=False),
        sa.Column("wallet", sa.String(32), nullable=False, server_default="Spot"),
        sa.Column("asset", sa.String(64), nullable=False),
        sa.Column("ticker", sa.String(16), nullable=False),
        sa.Column("amount", sa.Numeric(20, 8), nullable=False),
        sa.Column("fee", sa.Numeric(20, 8), nullable=False, server_default="0"),
        sa.Column("balance_after", sa.Numeric(20, 8), nullable=False),
        sa.Column(
            "executed_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_ledger_entries_trade_id", "ledger_entries", ["trade_id"])
    op.create_index(
        "ix_ledger_entries_portfolio_executed",
        "ledger_entries",
        ["portfolio_id", "executed_at"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_ledger_entries_portfolio_executed",
        table_name="ledger_entries",
    )
    op.drop_index("ix_ledger_entries_trade_id", table_name="ledger_entries")
    op.drop_table("ledger_entries")
