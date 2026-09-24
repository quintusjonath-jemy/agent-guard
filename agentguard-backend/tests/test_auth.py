import pytest
from app.services.rate_limiter import rate_limiter

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "healthy"

def test_login_admin_success(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@agentguard.io", "password": "Admin123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["email"] == "admin@agentguard.io"
    assert data["data"]["user"]["role"] == "SUPER_ADMIN"

def test_login_invalid_credentials(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@agentguard.io", "password": "WrongPassword!"}
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_register_user_success(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "DevOps Engineer",
            "email": "devops@agentguard.io",
            "password": "SecurePassword123!",
            "role": "SECURITY_ANALYST"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["data"]["user"]["email"] == "devops@agentguard.io"
    assert data["data"]["user"]["role"] == "SECURITY_ANALYST"

def test_register_duplicate_email(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Admin Clone",
            "email": "admin@agentguard.io",
            "password": "SecurePassword123!"
        }
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_get_profile_authenticated(client):
    # Login first
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@agentguard.io", "password": "Admin123!"}
    )
    token = login_res.json()["data"]["access_token"]

    # Request /me
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    data = me_res.json()
    assert data["success"] is True
    assert data["data"]["email"] == "admin@agentguard.io"

def test_get_profile_unauthorized(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401

def test_login_rate_limiting(client):
    # Try 5 failed login attempts
    email = "ratelimit_test@agentguard.io"
    for _ in range(5):
        client.post("/api/v1/auth/login", json={"email": email, "password": "BadPassword!"})

    # 6th attempt should trigger 429
    res = client.post("/api/v1/auth/login", json={"email": email, "password": "BadPassword!"})
    assert res.status_code == 429
    assert "Too many failed login attempts" in res.json()["detail"]
