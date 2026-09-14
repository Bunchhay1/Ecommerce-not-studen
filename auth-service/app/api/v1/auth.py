from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
    TokenResponse,
    VerifyEmailRequest,
)
from app.schemas.user import UserMeResponse
from app.services.auth_service import AuthService
from app.services.token_service import TokenService

router = APIRouter()


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(
    req: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> RegisterResponse:
    """
    Register a new user account with email and password.
    Assigns the default CUSTOMER role.
    """
    auth_service = AuthService(db)
    user = await auth_service.register(req)
    return RegisterResponse(
        user_id=user.id,
        email=user.email,
        message="Registration successful",
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate user and obtain JWT tokens",
)
async def login(
    req: LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """
    Authenticate with email and password to receive an Access Token and Refresh Token.
    """
    auth_service = AuthService(db)
    access_token, refresh_token, expires_in = await auth_service.login(req.email, req.password)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=expires_in,
    )


@router.post(
    "/refresh",
    response_model=RefreshTokenResponse,
    summary="Rotate refresh token and obtain a new access token",
)
async def refresh_token(
    req: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> RefreshTokenResponse:
    """
    Exchange a valid Refresh Token for a new Access Token and rotated Refresh Token.
    Detects token reuse to protect against stolen tokens.
    """
    token_service = TokenService(db)
    access_token, new_refresh_token, expires_in = await token_service.rotate_refresh_token(req.refresh_token)
    await db.commit()
    return RefreshTokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=expires_in,
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Revoke refresh token and logout",
)
async def logout(
    req: Optional[LogoutRequest] = None,
    current_user: Optional[User] = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """
    Revoke the provided refresh token or all tokens for the active user.
    """
    auth_service = AuthService(db)
    refresh_token_val = req.refresh_token if req else None
    user_id_val = current_user.id if current_user else None

    await auth_service.logout(refresh_token=refresh_token_val, user_id=user_id_val)
    return MessageResponse(message="Successfully logged out", success=True)


@router.get(
    "/me",
    response_model=UserMeResponse,
    summary="Get current authenticated user profile",
)
async def get_me(
    current_user: User = Depends(get_current_active_user),
) -> UserMeResponse:
    """
    Fetch the identity, email, and roles of the currently authenticated user.
    """
    return UserMeResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        roles=current_user.role_names,
    )


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Request a password reset link/token",
)
async def forgot_password(
    req: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """
    Generates a password reset token for the specified user email.
    In a complete setup, this triggers an email via message bus or SMTP.
    """
    auth_service = AuthService(db)
    token = await auth_service.create_password_reset_token(req.email)
    # Token would be sent via email service in production. For dev/demo logs, token is stored in DB.
    return MessageResponse(
        message="If the email exists in our records, a password reset link has been dispatched.",
        success=True,
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Reset password using reset token",
)
async def reset_password(
    req: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """
    Set a new password using a valid, unused password reset token.
    All active sessions are terminated upon successful reset.
    """
    auth_service = AuthService(db)
    await auth_service.reset_password(req.token, req.new_password)
    return MessageResponse(message="Password has been successfully updated.", success=True)


@router.post(
    "/verify-email",
    response_model=MessageResponse,
    summary="Verify user email address",
)
async def verify_email(
    req: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    """
    Verify the user's email using the verification token.
    """
    auth_service = AuthService(db)
    await auth_service.verify_email(req.token)
    return MessageResponse(message="Email address verified successfully.", success=True)
