"""Add password reset fields to User model

Revision ID: add_password_reset_fields
Revises: 53a9e4424247
Create Date: 2026-01-17 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_password_reset_fields'
down_revision = '53a9e4424247'
branch_labels = None
depends_on = None


def upgrade():
    # Add password reset fields to users table
    op.add_column('users', sa.Column('password_reset_token', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('password_reset_expires', sa.DateTime(), nullable=True))
    op.add_column('users', sa.Column('password_reset_sent', sa.DateTime(), nullable=True))


def downgrade():
    # Remove password reset fields from users table
    op.drop_column('users', 'password_reset_sent')
    op.drop_column('users', 'password_reset_expires')
    op.drop_column('users', 'password_reset_token')