from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db, require_roles
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import MessageResponse
from app.schemas.user import AssignRoleRequest, UserRead, UserUpdate

router = APIRouter()


@router.get(
    "/",
    response_model=List[UserRead],
    dependencies=[Depends(require_roles(["ADMIN"]))],
    summary="List all users (Admin only)",
)
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> List[UserRead]:
    user_repo = UserRepository(db)
    users = await user_repo.list_users(skip=skip, limit=limit)
    return users


@router.get(
    "/{user_id}",
    response_model=UserRead,
    summary="Get user details by ID",
)
async def get_user_by_id(
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    # Allow self access or Admin access
    if current_user.id != user_id and "ADMIN" not in current_user.role_names:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.patch(
    "/{user_id}",
    response_model=UserRead,
    summary="Update user details",
)
async def update_user(
    user_id: str,
    req: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    if current_user.id != user_id and "ADMIN" not in current_user.role_names:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if req.first_name is not None:
        user.first_name = req.first_name
    if req.last_name is not None:
        user.last_name = req.last_name

    await user_repo.update_user(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.put(
    "/{user_id}/roles",
    response_model=MessageResponse,
    dependencies=[Depends(require_roles(["ADMIN"]))],
    summary="Assign a role to a user (Admin only)",
)
async def assign_role(
    user_id: str,
    req: AssignRoleRequest,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    role = await user_repo.get_role_by_name(req.role_name)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role '{req.role_name}' does not exist",
        )

    await user_repo.assign_role_to_user(user, role)
    await db.commit()
    return MessageResponse(
        message=f"Role '{req.role_name}' successfully assigned to user '{user.email}'",
        success=True,
    )
