import pytest
from app.models.agent import Agent
from app.models.tool import Tool
from app.models.approval import Approval
from app.core.permissions import ExecutionDecision, ApprovalStatus

def get_admin_token(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@agentguard.io", "password": "Admin123!"}
    )
    return res.json()["data"]["access_token"]

def test_gateway_allowed_execution(client, db_session):
    token = get_admin_token(client)
    finance_bot = db_session.query(Agent).filter(Agent.name == "FinanceBot").first()

    # Allowed refund of Rs. 5,000 (within limit of 10,000)
    res = client.post(
        "/api/v1/execute",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "agent_id": finance_bot.id,
            "tool": "refund_customer",
            "action": "refund",
            "payload": {"customer_id": 105, "amount": 5000.0}
        }
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["decision"] == "ALLOWED"
    assert data["risk_score"] < 60
    assert data["execution_status"] == "COMPLETED"
    assert data["response_payload"]["success"] is True
    assert "REF-" in str(data["response_payload"])

def test_gateway_pending_approval_and_human_resolution(client, db_session):
    token = get_admin_token(client)
    finance_bot = db_session.query(Agent).filter(Agent.name == "FinanceBot").first()

    # High amount Rs. 85,000 triggers PENDING_APPROVAL
    res = client.post(
        "/api/v1/execute",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "agent_id": finance_bot.id,
            "tool": "refund_customer",
            "action": "refund",
            "payload": {"customer_id": 381, "amount": 85000.0}
        }
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["decision"] in ["PENDING_APPROVAL", "BLOCKED"]
    assert data["risk_score"] >= 60
    exec_id = data["execution_id"]

    # Check approval in approval inbox
    app_res = client.get("/api/v1/approvals", headers={"Authorization": f"Bearer {token}"})
    assert app_res.status_code == 200
    approvals = app_res.json()["data"]
    target_approval = next((a for a in approvals if a["execution_id"] == exec_id), None)
    
    if target_approval:
        app_id = target_approval["id"]
        # Human Supervisor Approves Action
        decision_res = client.post(
            f"/api/v1/approvals/{app_id}/approve",
            headers={"Authorization": f"Bearer {token}"},
            json={"decision_notes": "Authorized by Manager due to verified invoice defect."}
        )
        assert decision_res.status_code == 200
        assert decision_res.json()["data"]["status"] == "APPROVED"

def test_gateway_blocked_unauthorized_deletion(client, db_session):
    token = get_admin_token(client)
    support_bot = db_session.query(Agent).filter(Agent.name == "SupportBot").first()

    # SupportBot attempting customer.delete -> BLOCKED
    res = client.post(
        "/api/v1/execute",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "agent_id": support_bot.id,
            "tool": "customer.delete",
            "action": "delete",
            "payload": {"customer_id": 999}
        }
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["decision"] == "BLOCKED"
    assert data["execution_status"] == "BLOCKED"

def test_gateway_api_key_authentication(client, db_session):
    token = get_admin_token(client)
    finance_bot = db_session.query(Agent).filter(Agent.name == "FinanceBot").first()

    # 1. Create API key
    key_res = client.post(
        "/api/v1/api-keys",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "External n8n Agent Key", "agent_id": finance_bot.id}
    )
    api_key_secret = key_res.json()["data"]["api_key"]

    # 2. Call gateway using X-API-Key header
    gateway_res = client.post(
        "/api/v1/execute",
        headers={"X-API-Key": api_key_secret},
        json={
            "agent_id": finance_bot.id,
            "tool": "customer.read",
            "action": "read",
            "payload": {"customer_id": 442}
        }
    )
    assert gateway_res.status_code == 200
    assert gateway_res.json()["data"]["decision"] == "ALLOWED"

def test_execution_inspector_detail(client, db_session):
    token = get_admin_token(client)
    # List executions
    list_res = client.get("/api/v1/executions", headers={"Authorization": f"Bearer {token}"})
    assert list_res.status_code == 200
    items = list_res.json()["data"]
    assert len(items) > 0

    first_id = items[0]["id"]
    detail_res = client.get(f"/api/v1/executions/{first_id}", headers={"Authorization": f"Bearer {token}"})
    assert detail_res.status_code == 200
    detail = detail_res.json()["data"]
    assert "plain_english_explanation" in detail
    assert len(detail["pipeline_breakdown"]) >= 5
    assert detail["duration_ms"] >= 0
