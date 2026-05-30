"""alter_production_quantity_to_numeric

Revision ID: 4f99f2813aec
Revises: 169ec6a35cfc
Create Date: 2026-05-30 20:50:42.389494
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4f99f2813aec'
down_revision: Union[str, None] = '169ec6a35cfc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'monthly_production',
        'quantity',
        existing_type=sa.Integer(),
        type_=sa.Numeric(precision=15, scale=2),
        postgresql_using="quantity::numeric"
    )


def downgrade() -> None:
    op.alter_column(
        'monthly_production',
        'quantity',
        existing_type=sa.Numeric(precision=15, scale=2),
        type_=sa.Integer(),
        postgresql_using="quantity::integer"
    )
