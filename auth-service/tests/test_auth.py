import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_checks(client: AsyncClient):
    res = await client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "healthy"}

    res_live = await client.get("/health/live")
    assert res_live.status_code == 200
    assert res_live.json() == {"status": "alive"}


@pytest.mark.asyncio
async def test_register_user_success(client: AsyncClient):
    payload = {
        "email": "john.doe@example.com",
        "password": "StrongPassword123!",
        "first_name": "John",
        "last_name": "Doe",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "user_id" in data
    assert data["email"] == "john.doe@example.com"
    assert data["message"] == "Registration successful"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {
        "email": "duplicate@example.com",
        "password": "StrongPassword123!",
        "first_name": "Jane",
        "last_name": "Doe",
    }
    res1 = await client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = await client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


@pytest.mark.asyncio
async def test_register_weak_password_validation(client: AsyncClient):
    payload = {
        "email": "shortpwd@example.com",
        "password": "short",
        "first_name": "Short",
        "last_name": "Pass",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_and_me_flow(client: AsyncClient):
    # 1. Register
    reg_payload = {
        "email": "loginuser@example.com",
        "password": "SecurePassword123!",
        "first_name": "Login",
        "last_name": "User",
    }
    await client.post("/api/v1/auth/register", json=reg_payload)

    # 2. Login with wrong password
    bad_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "loginuser@example.com", "password": "WrongPassword!"},
    )
    assert bad_login.status_code == 401

    # 3. Login with correct credentials
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "loginuser@example.com", "password": "SecurePassword123!"},
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data
    assert "refresh_token" in login_data
    assert login_data["token_type"] == "bearer"
    assert login_data["expires_in"] == 900

    access_token = login_data["access_token"]
    refresh_token = login_data["refresh_token"]

    # 4. Access /me with Bearer token
    headers = {"Authorization": f"Bearer {access_token}"}
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "loginuser@example.com"
    assert me_data["first_name"] == "Login"
    assert "CUSTOMER" in me_data["roles"]


@pytest.mark.asyncio
async def test_refresh_token_rotation_and_reuse_detection(client: AsyncClient):
    # Register & Login
    await client.post(
        "/api/v1/auth/register",
        json={"email": "tokenuser@example.com", "password": "SecurePassword123!"},
    )
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "tokenuser@example.com", "password": "SecurePassword123!"},
    )
    initial_refresh = login_res.json()["refresh_token"]

    # Refresh 1: Rotate initial refresh token
    refresh_res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": initial_refresh},
    )
    assert refresh_res.status_code == 200
    rotated_data = refresh_res.json()
    new_access_token = rotated_data["access_token"]
    new_refresh_token = rotated_data["refresh_token"]
    assert new_refresh_token != initial_refresh

    # Verify new access token works
    me_res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {new_access_token}"})
    assert me_res.status_code == 200

    # Refresh 2: Token Reuse Attack - Attempting to use the OLD (revoked) initial_refresh token
    replay_res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": initial_refresh},
    )
    assert replay_res.status_code == 401
    assert "revoked" in replay_res.json()["detail"].lower()

    # Verify that reuse detection revoked ALL user sessions (even new_refresh_token is now invalid!)
    compromised_res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": new_refresh_token},
    )
    assert compromised_res.status_code == 401


@pytest.mark.asyncio
async def test_logout_revocation(client: AsyncClient):
    # Register & Login
    await client.post(
        "/api/v1/auth/register",
        json={"email": "logoutuser@example.com", "password": "SecurePassword123!"},
    )
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "logoutuser@example.com", "password": "SecurePassword123!"},
    )
    access_token = login_res.json()["access_token"]
    refresh_token = login_res.json()["refresh_token"]

    # Logout with refresh token
    logout_res = await client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": refresh_token},
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert logout_res.status_code == 200
    assert logout_res.json()["success"] is True

    # Try using refresh token after logout
    refresh_res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_res.status_code == 401


@pytest.mark.asyncio
async def test_password_reset_flow(client: AsyncClient, db_session):
    # 1. Register user
    await client.post(
        "/api/v1/auth/register",
        json={"email": "reset@example.com", "password": "OldPassword123!"},
    )

    # 2. Request forgot password
    forgot_res = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "reset@example.com"},
    )
    assert forgot_res.status_code == 200

    # 3. For testing, generate reset token directly via service
    from app.services.auth_service import AuthService
    auth_service = AuthService(db_session)
    raw_token = await auth_service.create_password_reset_token("reset@example.com")
    assert raw_token is not None

    # 4. Reset password
    reset_res = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": raw_token, "new_password": "BrandNewPassword123!"},
    )
    assert reset_res.status_code == 200
    assert reset_res.json()["success"] is True

    # 5. Old password no longer works
    old_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "reset@example.com", "password": "OldPassword123!"},
    )
    assert old_login.status_code == 401

    # 6. New password works
    new_login = await client.post(
        "/api/v1/auth/login",
        json={"email": "reset@example.com", "password": "BrandNewPassword123!"},
    )
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()


@pytest.mark.asyncio
async def test_email_verification_flow(client: AsyncClient, db_session):
    # 1. Register user
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "verify@example.com", "password": "Password123!"},
    )
    user_id = reg_res.json()["user_id"]

    # 2. Generate verification token
    from app.services.auth_service import AuthService
    auth_service = AuthService(db_session)
    verify_token = await auth_service.create_email_verification_token(user_id)

    # 3. Verify email with token
    verify_res = await client.post(
        "/api/v1/auth/verify-email",
        json={"token": verify_token},
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["success"] is True

    # 4. Login and verify is_verified is True in /me
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "verify@example.com", "password": "Password123!"},
    )
    token = login_res.json()["access_token"]
    me_res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["is_verified"] is True


@pytest.mark.asyncio
async def test_invalid_token_access(client: AsyncClient):
    # No auth header
    res_no_auth = await client.get("/api/v1/auth/me")
    assert res_no_auth.status_code == 403 or res_no_auth.status_code == 401

    # Malformed token
    res_bad_token = await client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-valid-jwt"})
    assert res_bad_token.status_code == 401
