import pytest

def get_admin_token(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@agentguard.io", "password": "Admin123!"}
    )
    return res.json()["data"]["access_token"]

def get_analyst_token(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "analyst@agentguard.io", "password": "Analyst123!"}
    )
    return res.json()["data"]["access_token"]

def test_list_users_as_admin(client):
    token = get_admin_token(client)
    res = client.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["data"]) >= 2

def test_list_users_as_analyst_forbidden(client):
    token = get_analyst_token(client)
    res = client.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403

def test_create_and_revoke_api_key(client):
    token = get_admin_token(client)
    
    # 1. Create API key
    create_res = client.post(
        "/api/v1/api-keys",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "n8n Autonomous Workflow Key", "expires_in_days": 30}
    )
    assert create_res.status_code == 201
    data = create_res.json()["data"]
    assert "api_key" in data
    assert data["api_key"].startswith("ag_live_")
    key_id = data["id"]
    
    # 2. List API keys
    list_res = client.get("/api/v1/api-keys", headers={"Authorization": f"Bearer {token}"})
    assert list_res.status_code == 200
    keys = list_res.json()["data"]
    assert any(k["id"] == key_id for k in keys)
    # Ensure plaintext secret is NOT present in list
    assert "api_key" not in keys[0]

    # 3. Revoke API key
    del_res = client.delete(f"/api/v1/api-keys/{key_id}", headers={"Authorization": f"Bearer {token}"})
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True
