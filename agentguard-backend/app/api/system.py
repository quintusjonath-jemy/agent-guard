"""System management, background tasks, and demo seeding endpoints."""

from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.api.deps import get_current_user, require_admin_or_above
from app.models.user import User
from app.models.agent import Agent
from app.schemas.common import ApiResponse
from app.workers.tasks import (
    celery_app,
    run_async_security_scan,
    expire_stale_approvals,
    generate_soc_summary,
    export_audit_report,
)
from app.database.seed_demo_data import seed_demo_data

router = APIRouter(prefix="/system", tags=["System & Background Workers"])


class SeedDemoRequest(BaseModel):
    clean: bool = Field(False, description="Whether to clear previous demo telemetry before seeding")


class TaskDispatchResponse(BaseModel):
    task_id: str
    task_name: str
    status: str
    message: str


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str  # PENDING, STARTED, SUCCESS, FAILURE, RETRY, REVOKED
    ready: bool
    successful: Optional[bool] = None
    result: Optional[Any] = None
    error: Optional[str] = None


class AsyncScanRequest(BaseModel):
    agent_id: int


class ExpireApprovalsRequest(BaseModel):
    max_age_hours: int = Field(24, ge=1, le=168)


class ExportAuditRequest(BaseModel):
    format: str = Field("json", pattern="^(json|csv)$")
    limit: int = Field(100, ge=10, le=1000)


@router.post("/seed-demo", response_model=ApiResponse[Dict[str, Any]])
def trigger_seed_demo_data(
    payload: SeedDemoRequest = SeedDemoRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above),
):
    """Seed comprehensive realistic mock executions, approvals, and incidents into the database."""
    result = seed_demo_data(db=db, clean=payload.clean)
    return ApiResponse(
        success=True,
        message="Demo security telemetry seeded successfully.",
        data=result,
    )


@router.post("/tasks/security-scan", response_model=ApiResponse[TaskDispatchResponse])
def dispatch_async_security_scan(
    payload: AsyncScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above),
):
    """Dispatch asynchronous red-team security scan task to Celery worker."""
    agent = db.query(Agent).filter(Agent.id == payload.agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent with ID {payload.agent_id} not found.",
        )

    task = run_async_security_scan.delay(agent_id=payload.agent_id)
    return ApiResponse(
        success=True,
        message=f"Dispatched background security scan for '{agent.name}'.",
        data=TaskDispatchResponse(
            task_id=task.id,
            task_name="run_async_security_scan",
            status="PENDING",
            message=f"Task queued with worker for agent '{agent.name}'.",
        ),
    )


@router.post("/tasks/expire-approvals", response_model=ApiResponse[TaskDispatchResponse])
def dispatch_expire_stale_approvals(
    payload: ExpireApprovalsRequest = ExpireApprovalsRequest(),
    current_user: User = Depends(require_admin_or_above),
):
    """Dispatch approval SLA expiration task to Celery worker."""
    task = expire_stale_approvals.delay(max_age_hours=payload.max_age_hours)
    return ApiResponse(
        success=True,
        message="Dispatched stale approvals expiration task.",
        data=TaskDispatchResponse(
            task_id=task.id,
            task_name="expire_stale_approvals",
            status="PENDING",
            message=f"Expiring approvals older than {payload.max_age_hours} hours.",
        ),
    )


@router.post("/tasks/soc-summary", response_model=ApiResponse[TaskDispatchResponse])
def dispatch_generate_soc_summary(
    current_user: User = Depends(get_current_user),
):
    """Dispatch background SOC telemetry summary task to Celery worker."""
    task = generate_soc_summary.delay()
    return ApiResponse(
        success=True,
        message="Dispatched background SOC summary generation task.",
        data=TaskDispatchResponse(
            task_id=task.id,
            task_name="generate_soc_summary",
            status="PENDING",
            message="Aggregating executive SOC telemetry metrics.",
        ),
    )


@router.post("/tasks/export-audit", response_model=ApiResponse[TaskDispatchResponse])
def dispatch_export_audit(
    payload: ExportAuditRequest = ExportAuditRequest(),
    current_user: User = Depends(require_admin_or_above),
):
    """Dispatch background compliance audit log export task to Celery worker."""
    task = export_audit_report.delay(format=payload.format, limit=payload.limit)
    return ApiResponse(
        success=True,
        message="Dispatched compliance audit log export task.",
        data=TaskDispatchResponse(
            task_id=task.id,
            task_name="export_audit_report",
            status="PENDING",
            message=f"Exporting top {payload.limit} audit log records as {payload.format.upper()}.",
        ),
    )


@router.get("/tasks/{task_id}", response_model=ApiResponse[TaskStatusResponse])
def get_task_status(
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    """Query the execution status and return value of an asynchronous Celery task."""
    async_res = celery_app.AsyncResult(task_id)

    task_status = async_res.status
    is_ready = async_res.ready()
    result_val = None
    err_msg = None

    if is_ready:
        if async_res.successful():
            result_val = async_res.result
        else:
            err_msg = str(async_res.result)

    return ApiResponse(
        success=True,
        data=TaskStatusResponse(
            task_id=task_id,
            status=task_status,
            ready=is_ready,
            successful=async_res.successful() if is_ready else None,
            result=result_val,
            error=err_msg,
        ),
    )
