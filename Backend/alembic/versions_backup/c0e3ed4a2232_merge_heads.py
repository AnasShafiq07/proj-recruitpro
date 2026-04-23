"""merge heads

Revision ID: c0e3ed4a2232
Revises: 993a992e80b9, b3916ec2b0a6
Create Date: 2025-10-04 16:18:52.401894

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c0e3ed4a2232'
down_revision: Union[str, Sequence[str], None] = ('993a992e80b9', 'b3916ec2b0a6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
