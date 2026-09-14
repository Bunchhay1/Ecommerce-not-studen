import pytest
from httpx import AsyncClient
from app.repositories.user_repository import UserRepository


@pytest.mark.asyncio
async def test_update_user_profile(client: AsyncClient):
    # Register
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "profile@example.com", "password": "Password123!", "first_name": "OldFirst"},
    )
    user_id = reg_res.json()["user_id"]

    # Login
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "profile@example.com", "password": "Password123!"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Update profile
    patch_res = await client.patch(
        f"/api/v1/users/{user_id}",
        json={"first_name": "NewFirst", "last_name": "NewLast"},
        headers=headers,
    )
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["first_name"] == "NewFirst"
    assert data["last_name"] == "NewLast"


@pytest.mark.asyncio
async def test_admin_role_assignment(client: AsyncClient, db_session):
    # 1. Register normal user
    await client.post(
        "/api/v1/auth/register",
        json={"email": "regular@example.com", "password": "Password123!"},
    )
    reg_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "regular@example.com", "password": "Password123!"},
    )
    user_token = reg_login.json()["access_token"]

    # 2. Register admin user & promote to ADMIN in DB directly
    admin_reg = await client.post(
        "/api/v1/auth/register",
        json={"email": "admin@example.com", "password": "AdminPassword123!"},
    )
    admin_id = admin_reg.json()["user_id"]

    user_repo = UserRepository(db_session)
    admin_user = await user_repo.get_by_id(admin_id)
    admin_role = await user_repo.get_role_by_name("ADMIN")
    await user_repo.assign_role_to_user(admin_user, admin_role)
    await db_session.commit()

    # Admin Login to get token with ADMIN claim
    admin_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@example.com", "password": "AdminPassword123!"},
    )
    admin_token = admin_login.json()["access_token"]

    # 3. Regular user fails to list users (403 Forbidden)
    forbidden_res = await client.get("/api/v1/users/", headers={"Authorization": f"Bearer {user_token}"})
    assert forbidden_res.status_code == 403

    # 4. Admin successfully lists all users
    admin_list_res = await client.get("/api/v1/users/", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_list_res.status_code == 200
    users_list = admin_list_res.json()
    assert len(users_list) >= 2
