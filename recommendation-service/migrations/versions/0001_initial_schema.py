"""Initial recommendation service schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-09-13 19:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. product_candidates table
    op.create_table(
        'product_candidates',
        sa.Column('product_id', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category_id', sa.String(length=64), nullable=True),
        sa.Column('category_name', sa.String(length=128), nullable=True),
        sa.Column('brand_id', sa.String(length=64), nullable=True),
        sa.Column('brand_name', sa.String(length=128), nullable=True),
        sa.Column('price', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('rating', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('rating_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('popularity_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('tags', sa.JSON(), nullable=False),
        sa.Column('attributes', sa.JSON(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_available', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('product_id'),
    )
    op.create_index('idx_candidate_cat_avail', 'product_candidates', ['category_id', 'is_available'])
    op.create_index('idx_candidate_brand_avail', 'product_candidates', ['brand_id', 'is_available'])

    # 2. product_relationships table
    op.create_table(
        'product_relationships',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('product_id', sa.String(length=64), nullable=False),
        sa.Column('related_product_id', sa.String(length=64), nullable=False),
        sa.Column('relationship_type', sa.String(length=32), nullable=False),
        sa.Column('score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('support_count', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('calculated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('product_id', 'related_product_id', 'relationship_type', name='uq_product_relationship'),
    )
    op.create_index('idx_rel_lookup', 'product_relationships', ['product_id', 'relationship_type', 'score'])

    # 3. user_product_interactions table
    op.create_table(
        'user_product_interactions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=64), nullable=True),
        sa.Column('session_id', sa.String(length=64), nullable=True),
        sa.Column('product_id', sa.String(length=64), nullable=False),
        sa.Column('event_type', sa.String(length=32), nullable=False),
        sa.Column('weight', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('metadata_', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_user_product_time', 'user_product_interactions', ['user_id', 'product_id', 'created_at'])
    op.create_index('idx_product_event_weight', 'user_product_interactions', ['product_id', 'event_type', 'created_at'])

    # 4. recommendations (cache record) table
    op.create_table(
        'recommendations',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=64), nullable=True),
        sa.Column('product_id', sa.String(length=64), nullable=False),
        sa.Column('recommendation_type', sa.String(length=32), nullable=False),
        sa.Column('score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('rank', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('reason', sa.String(length=255), nullable=True),
        sa.Column('model_version', sa.String(length=32), nullable=False, server_default='v1.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_rec_user_type_rank', 'recommendations', ['user_id', 'recommendation_type', 'rank'])

    # 5. recommendation_feedback table
    op.create_table(
        'recommendation_feedback',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('recommendation_id', sa.String(length=100), nullable=False),
        sa.Column('user_id', sa.String(length=64), nullable=True),
        sa.Column('session_id', sa.String(length=100), nullable=True),
        sa.Column('product_id', sa.String(length=64), nullable=False),
        sa.Column('strategy', sa.String(length=50), nullable=False),
        sa.Column('feedback_type', sa.String(length=32), nullable=False, server_default='SHOWN'),
        sa.Column('position', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

    # 6. model_metadata table
    op.create_table(
        'model_metadata',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('model_name', sa.String(length=100), nullable=False),
        sa.Column('version', sa.String(length=50), nullable=False),
        sa.Column('model_type', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('parameters', sa.JSON(), nullable=False),
        sa.Column('metrics', sa.JSON(), nullable=False),
        sa.Column('trained_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('model_metadata')
    op.drop_table('recommendation_feedback')
    op.drop_table('recommendations')
    op.drop_table('user_product_interactions')
    op.drop_table('product_relationships')
    op.drop_table('product_candidates')
