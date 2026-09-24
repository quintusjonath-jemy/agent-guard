"""Celery background worker tasks for asynchronous security scans, reporting, and maintenance."""

import os
import datetime
from celery import Celery
from app.core.config import get_settings

settings = get_settings()

redis_url = settings.REDIS_URL or "redis://localhost:6379/0"

celery_app = Celery(
    "agentguard_worker",
    broker=redis_url,
    backend=redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)


@celery_app.task(name="app.workers.tasks.run_async_security_scan")
def run_async_security_scan(agent_id: int):
    """Run full automated 10-scenario red team security scan against an agent."""
    from app.database.session import SessionLocal
    from app.services.simulator_service import simulator_service

    db = SessionLocal()
    try:
        results = simulator_service.run_full_suite(db, agent_id=agent_id)
        return {
            "agent_id": agent_id,
            "status": "COMPLETED",
            "score": results["score"],
            "total_tests": results["total_tests"],
            "passed_tests": results["passed_tests"],
            "failed_tests": results["failed_tests"],
        }
    except Exception as exc:
        return {"agent_id": agent_id, "status": "FAILED", "error": str(exc)}
    finally:
        db.close()


@celery_app.task(name="app.workers.tasks.expire_stale_approvals")
def expire_stale_approvals(max_age_hours: int = 24):
    """Expire pending human-in-the-loop approvals that have exceeded the SLA threshold."""
    from app.database.session import SessionLocal
    from app.models.approval import Approval, ApprovalStatus
    from app.models.execution import Execution, ExecutionDecision

    db = SessionLocal()
    try:
        cutoff = datetime.datetime.utcnow() - datetime.timedelta(hours=max_age_hours)
        stale_approvals = (
            db.query(Approval)
            .filter(
                Approval.status == ApprovalStatus.PENDING,
                Approval.requested_at < cutoff,
            )
            .all()
        )

        count = len(stale_approvals)
        for apprv in stale_approvals:
            apprv.status = ApprovalStatus.EXPIRED
            apprv.decision_notes = f"Auto-expired after {max_age_hours}h SLA limit."
            apprv.decided_at = datetime.datetime.utcnow()

            exec_record = db.query(Execution).filter(Execution.id == apprv.execution_id).first()
            if exec_record and exec_record.decision == ExecutionDecision.PENDING_APPROVAL:
                exec_record.decision = ExecutionDecision.BLOCKED
                exec_record.reason = "Approval request expired due to SLA timeout."

        db.commit()
        return {"status": "SUCCESS", "expired_count": count}
    except Exception as exc:
        db.rollback()
        return {"status": "FAILED", "error": str(exc)}
    finally:
        db.close()


@celery_app.task(name="app.workers.tasks.generate_soc_summary")
def generate_soc_summary():
    """Aggregate high-level SOC telemetry metrics for reporting."""
    from app.database.session import SessionLocal
    from app.services.dashboard_service import dashboard_service

    db = SessionLocal()
    try:
        metrics = dashboard_service.get_executive_metrics(db)
        return {
            "status": "SUCCESS",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "metrics": metrics,
        }
    except Exception as exc:
        return {"status": "FAILED", "error": str(exc)}
    finally:
        db.close()
