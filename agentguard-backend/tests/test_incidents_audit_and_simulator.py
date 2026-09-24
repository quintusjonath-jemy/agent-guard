import pytest
from app.models.agent import Agent
from app.models.incident import Incident
from app.core.permissions import IncidentStatus, IncidentSeverity

def get_admin_token(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@agentguard.io", "password": "Admin123!"}
    )
    return res.json()["data"]["access_token"]

def test_dashboard_stats_and_trends(client):
    token = get_admin_token(client)
    
    # 1. Stats
    stats_res = client.get("/api/v1/dashboard/stats", headers={"Authorization": f"Bearer {token}"})
    assert stats_res.status_code == 200
    stats = stats_res.json()["data"]
    assert stats["active_agents"] >= 4
    assert stats["security_score"] >= 50
    assert "system_status" in stats

    # 2. Trends
    trend_res = client.get("/api/v1/dashboard/security-trends?range_view=24H", headers={"Authorization": f"Bearer {token}"})
    assert trend_res.status_code == 200
    points = trend_res.json()["data"]
    assert len(points) == 12

    # 3. Risk Distribution
    risk_res = client.get("/api/v1/dashboard/risk-distribution", headers={"Authorization": f"Bearer {token}"})
    assert risk_res.status_code == 200

    # 4. Top Risky Agents
    risky_res = client.get("/api/v1/dashboard/top-risky-agents", headers={"Authorization": f"Bearer {token}"})
    assert risky_res.status_code == 200
    assert len(risky_res.json()["data"]) >= 4

def test_incident_lifecycle(client, db_session):
    token = get_admin_token(client)
    finance_bot = db_session.query(Agent).filter(Agent.name == "FinanceBot").first()

    # 1. Create test incident
    inc = Incident(
        title="Unauthorized Large Refund Attempt",
        description="FinanceBot attempted ₹85,000 refund bypassing standard policy limit",
        severity=IncidentSeverity.HIGH,
        agent_id=finance_bot.id,
        status=IncidentStatus.OPEN
    )
    db_session.add(inc)
    db_session.commit()
    db_session.refresh(inc)

    # 2. List incidents
    list_res = client.get("/api/v1/incidents", headers={"Authorization": f"Bearer {token}"})
    assert list_res.status_code == 200
    incidents = list_res.json()["data"]
    assert any(i["id"] == inc.id for i in incidents)

    # 3. Update incident to INVESTIGATING
    update_res = client.put(
        f"/api/v1/incidents/{inc.id}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "status": "INVESTIGATING",
            "analyst_notes": "Security analyst contacted billing team to verify customer invoice."
        }
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["status"] == "INVESTIGATING"

    # 4. Resolve incident
    resolve_res = client.put(
        f"/api/v1/incidents/{inc.id}",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "status": "RESOLVED",
            "analyst_notes": "Billing team confirmed fraudulent session token. Key rotated."
        }
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["data"]["status"] == "RESOLVED"
    assert resolve_res.json()["data"]["resolved_at"] is not None

def test_audit_logs_search(client):
    token = get_admin_token(client)
    res = client.get("/api/v1/audit-logs", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    logs = res.json()["data"]
    assert len(logs) > 0
    assert "event_type" in logs[0]
    assert "action" in logs[0]

def test_security_simulator_run_scenarios(client, db_session):
    token = get_admin_token(client)
    finance_bot = db_session.query(Agent).filter(Agent.name == "FinanceBot").first()

    # Run all 10 security test scenarios
    res = client.post(
        "/api/v1/security-tests/run",
        headers={"Authorization": f"Bearer {token}"},
        json={"agent_id": finance_bot.id}
    )
    assert res.status_code == 200
    report = res.json()["data"]
    assert report["total_tests"] == 10
    assert report["passed_tests"] > 0
    assert "results" in report
    assert len(report["results"]) == 10

    # Verify first scenario structure
    sc1 = report["results"][0]
    assert "scenario_name" in sc1
    assert "remediation_guidance" in sc1
    assert "passed" in sc1

    # Check history
    hist_res = client.get(f"/api/v1/security-tests?agent_id={finance_bot.id}", headers={"Authorization": f"Bearer {token}"})
    assert hist_res.status_code == 200
    assert len(hist_res.json()["data"]) >= 10
