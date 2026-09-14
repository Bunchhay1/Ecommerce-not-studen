from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    generate_secure_token,
    hash_token,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository


class TokenService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def issue_tokens_for_user(self, user: User) -> Tuple[str, str, int]:
        """
        Generates a new access token and a new refresh token for the given user.
        Stores the hashed refresh token in database.
        Returns: (access_token, raw_refresh_token, expires_in_seconds)
        """
        role_names = user.role_names or ["CUSTOMER"]
        access_token = create_access_token(subject=user.id, roles=role_names)

        # Generate opaque high-entropy refresh token
        raw_refresh_token = generate_secure_token(48)
        token_hash = hash_token(raw_refresh_token)

        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        await self.user_repo.create_refresh_token(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )

        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        return access_token, raw_refresh_token, expires_in

    async def rotate_refresh_token(self, raw_refresh_token: str) -> Tuple[str, str, int]:
        """
        Rotates a refresh token:
        - Validates the provided refresh token
        - Detects token reuse (if revoked token is used, revokes all user sessions!)
        - Invalidates the old token and issues a new access token + refresh token pair
        """
        token_hash = hash_token(raw_refresh_token)
        stored_token = await self.user_repo.get_refresh_token(token_hash)

        if not stored_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Token Reuse Detection: If someone attempts to use a revoked token, compromise assumed
        if stored_token.revoked:
            await self.user_repo.revoke_all_user_refresh_tokens(stored_token.user_id)
            await self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked. Security breach detected, all sessions terminated.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if stored_token.is_expired:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = await self.user_repo.get_by_id(stored_token.user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is inactive or not found",
            )

        # Generate new refresh token
        new_raw_refresh_token = generate_secure_token(48)
        new_token_hash = hash_token(new_raw_refresh_token)
        new_expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        # Mark old token revoked and linked to new
        await self.user_repo.revoke_refresh_token(token_hash=token_hash, replaced_by=new_token_hash)

        # Save new token
        await self.user_repo.create_refresh_token(
            user_id=user.id,
            token_hash=new_token_hash,
            expires_at=new_expires_at,
        )

        role_names = user.role_names or ["CUSTOMER"]
        new_access_token = create_access_token(subject=user.id, roles=role_names)
        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

        return new_access_token, new_raw_refresh_token, expires_in

    async def revoke_token(self, raw_refresh_token: str) -> None:
        """Revoke a single refresh token on logout."""
        token_hash = hash_token(raw_refresh_token)
        await self.user_repo.revoke_refresh_token(token_hash=token_hash)
