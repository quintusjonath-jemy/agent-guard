from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.execution import Execution
from app.models.agent import Agent
from app.models.tool import Tool
from app.models.user import User
from app.core.permissions import ExecutionDecision, RiskLevel
from app.schemas.execution import (
    ActionExecuteRequest,
    ExecutionResponse,
    ExecutionListItem,
    ExecutionDetailResponse,
    ExecutionPipelineStep
)
from app.schemas.common import ApiResponse
from app.api.deps import authenticate_caller, get_current_user
from app.services.execution_service import execution_service

router = APIRouter(prefix="/executions", tags=["Action Gateway & Executions"])

# 1. Main Action Gateway Endpoint: POST /api/v1/execute (can also be mapped at /api/v1/execute)
@router.post("/execute", response_model=ApiResponse[ExecutionResponse])
def execute_agent_action(
    request: Request,
    payload: ActionExecuteRequest,
    db: Session = Depends(get_db),
    auth_context: dict = Depends(authenticate_caller)
):
    """
    Main AgentGuard Action Gateway.
    Inspects, validates, scans, evaluates policies, calculates risk, and gates execution.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    response = execution_service.process_action(
        db=db,
        request=payload,
        auth_context=auth_context,
        client_ip=client_ip
    )
    return ApiResponse(
        success=True,
        message=f"Action evaluated: {response.decision.value}",
        data=response
    )

@router.get("", response_model=ApiResponse[List[ExecutionListItem]])
def list_executions(
    agent_id: Optional[int] = None,
    tool_id: Optional[int] = None,
    decision: Optional[ExecutionDecision] = None,
    risk_level: Optional[RiskLevel] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Execution).order_by(Execution.created_at.desc())
    if agent_id:
        query = query.filter(Execution.agent_id == agent_id)
    if tool_id:
        query = query.filter(Execution.tool_id == tool_id)
    if decision:
        query = query.filter(Execution.decision == decision)
    if risk_level:
        query = query.filter(Execution.risk_level == risk_level)

    executions = query.limit(limit).all()
    results = []
    for e in executions:
        results.append(
            ExecutionListItem(
                id=e.id,
                agent_id=e.agent_id,
                agent_name=e.agent.name if e.agent else "Unknown Agent",
                tool_id=e.tool_id,
                tool_name=e.tool.name if e.tool else "Unknown Tool",
                action_name=e.action_name,
                decision=e.decision,
                risk_score=e.risk_score,
                risk_level=e.risk_level,
                reason=e.reason,
                execution_status=e.execution_status,
                duration_ms=e.duration_ms,
                created_at=e.created_at
            )
        )
    return ApiResponse(success=True, data=results)

@router.get("/{execution_id}", response_model=ApiResponse[ExecutionDetailResponse])
def get_execution_detail(
    execution_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Execution record not found.")

    agent_name = execution.agent.name if execution.agent else "Unknown Agent"
    tool_name = execution.tool.name if execution.tool else "Unknown Tool"

    # Generate plain-English explanation for live demonstration and SOC analysis
    explanation = _generate_plain_english_explanation(execution)

    # Format pipeline breakdown
    raw_breakdown = execution.pipeline_breakdown or []
    pipeline_steps = [ExecutionPipelineStep(**s) if isinstance(s, dict) else s for s in raw_breakdown]

    approval_dict = None
    if execution.approval:
        approval_dict = {
            "id": execution.approval.id,
            "status": execution.approval.status.value,
            "reason": execution.approval.reason,
            "decision_notes": execution.approval.decision_notes,
            "approved_by": execution.approval.approved_by,
            "approver_name": execution.approval.approver.name if execution.approval.approver else None,
            "decided_at": execution.approval.decided_at
        }

    return ApiResponse(
        success=True,
        data=ExecutionDetailResponse(
            id=execution.id,
            agent_id=execution.agent_id,
            agent_name=agent_name,
            provider=execution.agent.provider if execution.agent else "Unknown Provider",
            environment=execution.agent.environment if execution.agent else "Production",
            tool_id=execution.tool_id,
            tool_name=tool_name,
            action_name=execution.action_name,
            request_payload=execution.request_payload or {},
            sanitized_payload=execution.sanitized_payload or {},
            decision=execution.decision,
            risk_score=execution.risk_score,
            risk_level=execution.risk_level,
            reason=execution.reason,
            plain_english_explanation=explanation,
            pipeline_breakdown=pipeline_steps,
            execution_status=execution.execution_status,
            response_payload=execution.response_payload,
            duration_ms=execution.duration_ms,
            created_at=execution.created_at,
            approval=approval_dict
        )
    )

def _generate_plain_english_explanation(execution: Execution) -> str:
    agent_name = execution.agent.name if execution.agent else "The AI Agent"
    tool_name = execution.tool.name if execution.tool else "the requested tool"
    
    if execution.decision == ExecutionDecision.ALLOWED:
        return (
            f"{agent_name} requested action '{execution.action_name}' using tool '{tool_name}'. "
            f"The action satisfied all active least-privilege permissions and policy limits (Risk Score: {execution.risk_score}/100 - LOW). "
            "AgentGuard verified authorization and executed the tool successfully."
        )
    elif execution.decision == ExecutionDecision.PENDING_APPROVAL:
        return (
            f"{agent_name} attempted to invoke '{tool_name}'. "
            f"Because this action involves high-risk parameters or exceeds automated financial thresholds (Risk Score: {execution.risk_score}/100), "
            "AgentGuard paused execution and routed the action to the Human Approval Center."
        )
    elif execution.decision == ExecutionDecision.BLOCKED:
        return (
            f"AgentGuard blocked {agent_name} from executing '{tool_name}'. "
            f"Reason: {execution.reason or 'The request violated configured security or governance rules.'} "
            f"Calculated Risk Score: {execution.risk_score}/100 ({execution.risk_level.value}). "
            "Server-side controls prevented execution before any tool API was reached."
        )
    return f"Execution #{execution.id} processed with state: {execution.decision.value}."
