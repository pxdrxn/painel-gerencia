"""add_pause_date_to_vacations

Revision ID: c2d3e4f5a6b7
Revises: 4f99f2813aec
Create Date: 2026-07-31 17:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c2d3e4f5a6b7'
down_revision: Union[str, None] = '4f99f2813aec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'vacations',
        sa.Column('pause_date', sa.Date(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('vacations', 'pause_date')
