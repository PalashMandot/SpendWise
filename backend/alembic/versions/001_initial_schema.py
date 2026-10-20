"""Initial schema setup

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-20 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('currency', sa.String(length=10), nullable=False, server_default='USD'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. categories
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('type', sa.String(length=20), nullable=False, server_default='expense'),
        sa.Column('color', sa.String(length=20), nullable=False, server_default='#64748B'),
        sa.Column('icon', sa.String(length=50), nullable=False, server_default='tag'),
        sa.Column('is_system', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)
    op.create_index(op.f('ix_categories_user_id'), 'categories', ['user_id'], unique=False)

    # 3. transactions
    op.create_table(
        'transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('type', sa.String(length=20), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('payment_method', sa.String(length=50), nullable=False, server_default='credit_card'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_recurring', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transactions_id'), 'transactions', ['id'], unique=False)
    op.create_index(op.f('ix_transactions_user_id'), 'transactions', ['user_id'], unique=False)
    op.create_index(op.f('ix_transactions_category_id'), 'transactions', ['category_id'], unique=False)
    op.create_index(op.f('ix_transactions_date'), 'transactions', ['date'], unique=False)
    op.create_index(op.f('ix_transactions_description'), 'transactions', ['description'], unique=False)

    # 4. budgets
    op.create_table(
        'budgets',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('month', sa.String(length=7), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('alert_threshold', sa.Float(), nullable=False, server_default='0.8'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'category_id', 'month', name='uq_user_category_month_budget')
    )
    op.create_index(op.f('ix_budgets_id'), 'budgets', ['id'], unique=False)
    op.create_index(op.f('ix_budgets_user_id'), 'budgets', ['user_id'], unique=False)
    op.create_index(op.f('ix_budgets_category_id'), 'budgets', ['category_id'], unique=False)
    op.create_index(op.f('ix_budgets_month'), 'budgets', ['month'], unique=False)

    # 5. recurring_transactions
    op.create_table(
        'recurring_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('type', sa.String(length=20), nullable=False, server_default='expense'),
        sa.Column('description', sa.String(length=255), nullable=False),
        sa.Column('frequency', sa.String(length=20), nullable=False, server_default='monthly'),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('next_due_date', sa.Date(), nullable=False),
        sa.Column('payment_method', sa.String(length=50), nullable=False, server_default='bank_transfer'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_recurring_transactions_id'), 'recurring_transactions', ['id'], unique=False)
    op.create_index(op.f('ix_recurring_transactions_user_id'), 'recurring_transactions', ['user_id'], unique=False)
    op.create_index(op.f('ix_recurring_transactions_category_id'), 'recurring_transactions', ['category_id'], unique=False)
    op.create_index(op.f('ix_recurring_transactions_next_due_date'), 'recurring_transactions', ['next_due_date'], unique=False)


def downgrade() -> None:
    op.drop_table('recurring_transactions')
    op.drop_table('budgets')
    op.drop_table('transactions')
    op.drop_table('categories')
    op.drop_table('users')
