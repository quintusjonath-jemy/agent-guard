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
    from app.database.connection import SessionLocal
    from app.models.agent import Agent
    from app.services.simulator_service import simulator_service

    db = SessionLocal()
    try:
        agent = db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            return {"agent_id": agent_id, "status": "FAILED", "error": f"Agent with ID {agent_id} not found."}

        report = simulator_service.run_tests_for_agent(db, agent=agent)
        return {
            "agent_id": agent.id,
            "agent_name": agent.name,
            "status": "COMPLETED",
            "overall_health": report.overall_health,
            "total_tests": report.total_tests,
            "passed_tests": report.passed_tests,
            "failed_tests": report.failed_tests,
            "critical_findings": report.critical_findings,
            "high_risk_findings": report.high_risk_findings,
            "medium_findings": report.medium_findings,
            "low_findings": report.low_findings,
            "executed_at": report.executed_at.isoformat() if hasattr(report.executed_at, "isoformat") else str(report.executed_at)
        }
    except Exception as exc:
        return {"agent_id": agent_id, "status": "FAILED", "error": str(exc)}
    finally:
        db.close()


@celery_app.task(name="app.workers.tasks.expire_stale_approvals")
def expire_stale_approvals(max_age_hours: int = 24):
    """Expire pending human-in-the-loop approvals that have exceeded the SLA threshold."""
    from app.database.connection import SessionLocal
    from app.models.approval import Approval
    from app.models.execution import Execution
    from app.core.permissions import ApprovalStatus, ExecutionDecision

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
    from app.database.connection import SessionLocal
    from app.models.agent import Agent
    from app.models.execution import Execution
    from app.models.approval import Approval
    from app.models.incident import Incident
    from app.core.permissions import AgentStatus, ExecutionDecision, ApprovalStatus, IncidentStatus, RiskLevel

    db = SessionLocal()
    try:
        active_agents = db.query(Agent).filter(Agent.status == AgentStatus.ACTIVE).count()
        total_executions = db.query(Execution).count()
        blocked_executions = db.query(Execution).filter(Execution.decision == ExecutionDecision.BLOCKED).count()
        pending_approvals = db.query(Approval).filter(Approval.status == ApprovalStatus.PENDING).count()
        open_incidents = db.query(Incident).filter(Incident.status != IncidentStatus.RESOLVED).count()

        low_cnt = db.query(Execution).filter(Execution.risk_level == RiskLevel.LOW).count()
        med_cnt = db.query(Execution).filter(Execution.risk_level == RiskLevel.MEDIUM).count()
        high_cnt = db.query(Execution).filter(Execution.risk_level == RiskLevel.HIGH).count()
        crit_cnt = db.query(Execution).filter(Execution.risk_level == RiskLevel.CRITICAL).count()

        return {
            "status": "SUCCESS",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "metrics": {
                "active_agents": active_agents,
                "total_executions": total_executions,
                "blocked_executions": blocked_executions,
                "pending_approvals": pending_approvals,
                "open_incidents": open_incidents,
                "risk_distribution": {
                    "low": low_cnt,
                    "medium": med_cnt,
                    "high": high_cnt,
                    "critical": crit_cnt,
                    "total": low_cnt + med_cnt + high_cnt + crit_cnt,
                },
            },
        }
    except Exception as exc:
        return {"status": "FAILED", "error": str(exc)}
    finally:
        db.close()


@celery_app.task(name="app.workers.tasks.export_audit_report")
def export_audit_report(format: str = "json", limit: int = 100):
    """Generate an asynchronous compliance audit report containing recent security events."""
    from app.database.connection import SessionLocal
    from app.models.audit_log import AuditLog

    db = SessionLocal()
    try:
        logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
        records = [
            {
                "id": log.id,
                "event_type": log.event_type,
                "action": log.action,
                "decision": log.decision,
                "risk_level": log.risk_level,
                "description": log.description,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat() if hasattr(log.created_at, "isoformat") else str(log.created_at),
            }
            for log in logs
        ]
        return {
            "status": "SUCCESS",
            "format": format,
            "record_count": len(records),
            "generated_at": datetime.datetime.utcnow().isoformat(),
            "records": records,
        }
    except Exception as exc:
        return {"status": "FAILED", "error": str(exc)}
    finally:
        db.close()
