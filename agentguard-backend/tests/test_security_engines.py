import pytest
from app.services.sensitive_data_service import sensitive_data_service
from app.services.permission_service import permission_service
from app.services.policy_engine import policy_engine
from app.services.risk_engine import risk_engine
from app.models.agent import Agent
from app.models.tool import Tool
from app.core.permissions import ExecutionDecision, RiskLevel

def get_admin_token(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@agentguard.io", "password": "Admin123!"}
    )
    return res.json()["data"]["access_token"]

def test_dlp_scanner_api_key_detection():
    payload = {
        "customer_id": 402,
        "message": "Here is the key sk-abcdef1234567890abcdef1234567890 to access customer database"
    }
    result = sensitive_data_service.scan_and_sanitize(payload)
    assert result.has_sensitive_data is True
    assert len(result.findings) >= 1
    assert result.findings[0].severity == RiskLevel.CRITICAL
    assert "sk-" not in str(result.sanitized_payload)
    assert "***REDACTED_OPENAI_API_KEY***" in result.sanitized_payload["message"]

def test_dlp_scanner_clean_payload():
    payload = {
        "customer_id": 101,
        "amount": 4500,
        "reason": "Damaged goods return"
    }
    result = sensitive_data_service.scan_and_sanitize(payload)
    assert result.has_sensitive_data is False
    assert len(result.findings) == 0

def test_permission_engine_financial_limit(db_session):
    finance_bot = db_session.query(Agent).filter(Agent.name == "FinanceBot").first()
    refund_tool = db_session.query(Tool).filter(Tool.name == "refund_customer").first()
    
    # 1. Allowed refund amount (Rs. 5,000 <= 10,000)
    allowed_check = permission_service.evaluate_permission(
        db_session, finance_bot, refund_tool, "refund", {"amount": 5000.0}
    )
    assert allowed_check.allowed is True
    assert allowed_check.limit_exceeded is False

    # 2. Exceeded refund amount (Rs. 85,000 > 10,000)
    exceeded_check = permission_service.evaluate_permission(
        db_session, finance_bot, refund_tool, "refund", {"amount": 85000.0}
    )
    assert exceeded_check.allowed is False
    assert exceeded_check.limit_exceeded is True
    assert exceeded_check.requested_amount == 85000.0
    assert exceeded_check.configured_limit == 10000.0

def test_permission_engine_unauthorized_tool(db_session):
    support_bot = db_session.query(Agent).filter(Agent.name == "SupportBot").first()
    db_export_tool = db_session.query(Tool).filter(Tool.name == "database.export").first()

    # SupportBot does not have database.export assigned
    check = permission_service.evaluate_permission(
        db_session, support_bot, db_export_tool, "export", {}
    )
    assert check.allowed is False
    assert check.tool_assigned is False
    assert "Least-privilege violation" in check.reason

def test_policy_engine_and_risk_scoring(db_session):
    finance_bot = db_session.query(Agent).filter(Agent.name == "FinanceBot").first()
    refund_tool = db_session.query(Tool).filter(Tool.name == "refund_customer").first()
    
    payload = {"customer_id": 381, "amount": 85000.0}
    dlp_res = sensitive_data_service.scan_and_sanitize(payload)
    perm_res = permission_service.evaluate_permission(db_session, finance_bot, refund_tool, "refund", payload)
    
    policy_res = policy_engine.evaluate(db_session, finance_bot, refund_tool, "refund", payload, perm_res, dlp_res)
    assert policy_res.requires_human_approval is True
    assert policy_res.decision in [ExecutionDecision.PENDING_APPROVAL, ExecutionDecision.BLOCKED]

    risk_res = risk_engine.calculate_risk(finance_bot, refund_tool, "refund", payload, perm_res, dlp_res, policy_res)
    assert risk_res.score >= 60
    assert risk_res.level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
    assert len(risk_res.factors) > 0

def test_policy_simulator_api(client):
    token = get_admin_token(client)
    res = client.post(
        "/api/v1/policies/simulate",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "agent_id": 1,
            "tool_name": "refund_customer",
            "action": "refund",
            "payload": {"customer_id": 381, "amount": 85000.0}
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    sim = data["data"]
    assert sim["decision"] in ["PENDING_APPROVAL", "BLOCKED"]
    assert sim["risk_score"] >= 60
    assert sim["requires_human_approval"] is True
