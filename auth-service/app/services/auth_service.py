from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    generate_secure_token,
    get_password_hash,
    hash_token,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import RegisterRequest
from app.services.token_service import TokenService


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.token_service = TokenService(db)

    async def ensure_default_roles(self) -> None:
        """Ensure standard roles exist in the database."""
        default_roles = [
            ("CUSTOMER", "Standard customer account"),
            ("SELLER", "Merchant / seller account"),
            ("ADMIN", "System administrator"),
        ]
        for role_name, description in default_roles:
            role = await self.user_repo.get_role_by_name(role_name)
            if not role:
                await self.user_repo.create_role(name=role_name, description=description)

    async def register(self, req: RegisterRequest) -> User:
        """Register a new user and assign default CUSTOMER role."""
        existing_user = await self.user_repo.get_by_email(req.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists",
            )

        # Ensure default roles exist and assign CUSTOMER
        await self.ensure_default_roles()
        customer_role = await self.user_repo.get_role_by_name("CUSTOMER")
        roles = [customer_role] if customer_role else []

        password_hash = get_password_hash(req.password)
        user = await self.user_repo.create_user(
            email=req.email,
            password_hash=password_hash,
            first_name=req.first_name,
            last_name=req.last_name,
            is_active=True,
            is_verified=False,
            roles=roles,
        )

        await self.db.commit()
        return user

    async def authenticate(self, email: str, password: str) -> User:
        """Verify user credentials."""
        user = await self.user_repo.get_by_email(email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated",
            )
        return user

    async def login(self, email: str, password: str) -> Tuple[str, str, int]:
        """Authenticate user and return (access_token, refresh_token, expires_in)."""
        user = await self.authenticate(email, password)
        access_token, refresh_token, expires_in = await self.token_service.issue_tokens_for_user(user)
        await self.db.commit()
        return access_token, refresh_token, expires_in

    async def logout(self, refresh_token: Optional[str] = None, user_id: Optional[str] = None) -> None:
        """Logout user and revoke refresh token(s)."""
        if refresh_token:
            await self.token_service.revoke_token(refresh_token)
        elif user_id:
            await self.user_repo.revoke_all_user_refresh_tokens(user_id)
        await self.db.commit()

    async def create_password_reset_token(self, email: str) -> Optional[str]:
        """Generate a password reset token for the given email."""
        user = await self.user_repo.get_by_email(email)
        if not user or not user.is_active:
            # Silently return to prevent user enumeration attacks
            return None

        raw_token = generate_secure_token(32)
        token_hash = hash_token(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.PASSWORD_RESET_TOKEN_EXPIRE_HOURS)

        await self.user_repo.create_password_reset_token(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        await self.db.commit()
        return raw_token

    async def reset_password(self, raw_token: str, new_password: str) -> None:
        """Reset password using a valid reset token and revoke all active sessions."""
        token_hash = hash_token(raw_token)
        reset_record = await self.user_repo.get_password_reset_token(token_hash)

        if not reset_record or not reset_record.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset token",
            )

        user = await self.user_repo.get_by_id(reset_record.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # Update password hash
        user.password_hash = get_password_hash(new_password)
        reset_record.used = True
        self.db.add(reset_record)
        self.db.add(user)

        # Invalidate all active refresh tokens for security
        await self.user_repo.revoke_all_user_refresh_tokens(user.id)
        await self.db.commit()

    async def create_email_verification_token(self, user_id: str) -> str:
        """Create email verification token."""
        raw_token = generate_secure_token(32)
        token_hash = hash_token(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.EMAIL_VERIFY_TOKEN_EXPIRE_HOURS)

        await self.user_repo.create_email_verification_token(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        await self.db.commit()
        return raw_token

    async def verify_email(self, raw_token: str) -> None:
        """Verify user's email address."""
        token_hash = hash_token(raw_token)
        verify_record = await self.user_repo.get_email_verification_token(token_hash)

        if not verify_record or not verify_record.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired email verification token",
            )

        user = await self.user_repo.get_by_id(verify_record.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        user.is_verified = True
        verify_record.used = True
        self.db.add(verify_record)
        self.db.add(user)
        await self.db.commit()
