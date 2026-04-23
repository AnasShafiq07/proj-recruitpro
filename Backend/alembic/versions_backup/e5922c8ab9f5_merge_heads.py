"""merge heads

Revision ID: e5922c8ab9f5
Revises: 32331156e651, 8adaad45beeb
Create Date: 2025-09-27 16:41:52.845778

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5922c8ab9f5'
down_revision: Union[str, Sequence[str], None] = ('32331156e651', '8adaad45beeb')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
