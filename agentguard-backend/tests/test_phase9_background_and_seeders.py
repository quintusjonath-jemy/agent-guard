import pytest
from app.database.seed_demo_data import seed_demo_data
from app.workers.tasks import (
    expire_stale_approvals,
    generate_soc_summary,
    export_audit_report,
    run_async_security_scan,
)
from app.models.approval import Approval, ApprovalStatus
from app.models.execution import Execution, ExecutionDecision
from app.models.incident import Incident
from app.models.agent import Agent


def get_admin_token(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@agentguard.io", "password": "Admin123!"}
    )
    return res.json()["data"]["access_token"]


def test_seed_demo_data_function(db_session):
    """Verify demo seeder populates realistic executions, approvals, and incidents."""
    res = seed_demo_data(db=db_session, clean=False)
    assert res["status"] == "SUCCESS"
    assert res["executions_seeded"] > 0
    assert res["approvals_seeded"] > 0

    # Verify executions present
    exec_count = db_session.query(Execution).count()
    assert exec_count >= 10

    # Verify pending and approved approvals present
    pending = db_session.query(Approval).filter(Approval.status == ApprovalStatus.PENDING).count()
    assert pending >= 1

    # Verify incidents present
    inc_count = db_session.query(Incident).count()
    assert inc_count >= 1


def test_system_seed_demo_api(client):
    """Verify POST /api/v1/system/seed-demo seeds demo records."""
    token = get_admin_token(client)
    response = client.post(
        "/api/v1/system/seed-demo",
        headers={"Authorization": f"Bearer {token}"},
        json={"clean": False}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "SUCCESS"


def test_worker_task_generate_soc_summary(db_session):
    """Verify Celery task generate_soc_summary aggregates metrics correctly."""
    result = generate_soc_summary()
    assert result["status"] == "SUCCESS"
    assert "metrics" in result
    metrics = result["metrics"]
    assert metrics["active_agents"] >= 1
    assert metrics["total_executions"] >= 1
    assert "risk_distribution" in metrics


def test_worker_task_export_audit_report(db_session):
    """Verify Celery task export_audit_report aggregates audit events."""
    result = export_audit_report(format="json", limit=50)
    assert result["status"] == "SUCCESS"
    assert result["format"] == "json"
    assert isinstance(result["records"], list)


def test_worker_task_expire_stale_approvals(db_session):
    """Verify Celery task expire_stale_approvals expires pending approvals older than threshold."""
    # Run with max_age_hours=0 so all currently pending approvals qualify
    result = expire_stale_approvals(max_age_hours=0)
    assert result["status"] == "SUCCESS"
    assert "expired_count" in result


def test_worker_task_run_async_security_scan(db_session):
    """Verify Celery task run_async_security_scan runs 10 test scenarios for an agent."""
    agent = db_session.query(Agent).first()
    assert agent is not None
    result = run_async_security_scan(agent_id=agent.id)
    assert result["status"] == "COMPLETED"
    assert result["agent_id"] == agent.id
    assert result["total_tests"] == 10
    assert "overall_health" in result


def test_system_tasks_dispatch_api(client):
    """Verify system task dispatch endpoints return Celery task_id with PENDING status."""
    token = get_admin_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # SOC summary dispatch
    res1 = client.post("/api/v1/system/tasks/soc-summary", headers=headers)
    assert res1.status_code == 200
    d1 = res1.json()
    assert d1["success"] is True
    assert "task_id" in d1["data"]
    assert d1["data"]["status"] == "PENDING"

    task_id = d1["data"]["task_id"]

    # Task status query
    res2 = client.get(f"/api/v1/system/tasks/{task_id}", headers=headers)
    assert res2.status_code == 200
    d2 = res2.json()
    assert d2["success"] is True
    assert d2["data"]["task_id"] == task_id
    assert "ready" in d2["data"]

    # Expire approvals dispatch
    res3 = client.post("/api/v1/system/tasks/expire-approvals", headers=headers, json={"max_age_hours": 24})
    assert res3.status_code == 200
    d3 = res3.json()
    assert d3["success"] is True
    assert "task_id" in d3["data"]

    # Export audit dispatch
    res4 = client.post("/api/v1/system/tasks/export-audit", headers=headers, json={"format": "json", "limit": 50})
    assert res4.status_code == 200
    d4 = res4.json()
    assert d4["success"] is True
    assert "task_id" in d4["data"]
