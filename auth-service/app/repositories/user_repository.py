from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.role import Permission, Role, user_roles
from app.models.token import EmailVerificationToken, PasswordResetToken, RefreshToken
from app.models.user import User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # User operations
    async def get_by_id(self, user_id: str) -> Optional[User]:
        query = select(User).where(User.id == user_id).options(selectinload(User.roles))
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_by_email(self, email: str) -> Optional[User]:
        query = select(User).where(User.email == email.lower()).options(selectinload(User.roles))
        result = await self.db.execute(query)
        return result.scalars().first()

    async def create_user(
        self,
        email: str,
        password_hash: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        is_active: bool = True,
        is_verified: bool = False,
        roles: Optional[List[Role]] = None,
    ) -> User:
        user = User(
            email=email.lower(),
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            is_active=is_active,
            is_verified=is_verified,
            roles=roles if roles is not None else [],
        )
        self.db.add(user)
        await self.db.flush()
        return user

    async def update_user(self, user: User) -> User:
        self.db.add(user)
        await self.db.flush()
        return user

    async def list_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        query = select(User).offset(skip).limit(limit).options(selectinload(User.roles))
        result = await self.db.execute(query)
        return list(result.scalars().all())

    # Role operations
    async def get_role_by_name(self, role_name: str) -> Optional[Role]:
        query = select(Role).where(Role.name == role_name.upper())
        result = await self.db.execute(query)
        return result.scalars().first()

    async def create_role(self, name: str, description: Optional[str] = None) -> Role:
        role = Role(name=name.upper(), description=description)
        self.db.add(role)
        await self.db.flush()
        return role

    async def assign_role_to_user(self, user: User, role: Role) -> None:
        if role not in user.roles:
            user.roles.append(role)
            self.db.add(user)
            await self.db.flush()

    async def remove_role_from_user(self, user: User, role: Role) -> None:
        if role in user.roles:
            user.roles.remove(role)
            self.db.add(user)
            await self.db.flush()

    # Refresh Token operations
    async def create_refresh_token(
        self,
        user_id: str,
        token_hash: str,
        expires_at: datetime,
    ) -> RefreshToken:
        refresh_token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            revoked=False,
        )
        self.db.add(refresh_token)
        await self.db.flush()
        return refresh_token

    async def get_refresh_token(self, token_hash: str) -> Optional[RefreshToken]:
        query = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def revoke_refresh_token(self, token_hash: str, replaced_by: Optional[str] = None) -> bool:
        token = await self.get_refresh_token(token_hash)
        if token:
            token.revoked = True
            if replaced_by:
                token.replaced_by = replaced_by
            self.db.add(token)
            await self.db.flush()
            return True
        return False

    async def revoke_all_user_refresh_tokens(self, user_id: str) -> None:
        query = (
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked == False)
            .values(revoked=True)
        )
        await self.db.execute(query)
        await self.db.flush()

    # Password Reset operations
    async def create_password_reset_token(
        self,
        user_id: str,
        token_hash: str,
        expires_at: datetime,
    ) -> PasswordResetToken:
        token = PasswordResetToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            used=False,
        )
        self.db.add(token)
        await self.db.flush()
        return token

    async def get_password_reset_token(self, token_hash: str) -> Optional[PasswordResetToken]:
        query = select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
        result = await self.db.execute(query)
        return result.scalars().first()

    # Email Verification operations
    async def create_email_verification_token(
        self,
        user_id: str,
        token_hash: str,
        expires_at: datetime,
    ) -> EmailVerificationToken:
        token = EmailVerificationToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            used=False,
        )
        self.db.add(token)
        await self.db.flush()
        return token

    async def get_email_verification_token(self, token_hash: str) -> Optional[EmailVerificationToken]:
        query = select(EmailVerificationToken).where(EmailVerificationToken.token_hash == token_hash)
        result = await self.db.execute(query)
        return result.scalars().first()
