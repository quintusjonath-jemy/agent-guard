from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from app.core.permissions import ApprovalStatus, RiskLevel

class ApprovalDecisionRequest(BaseModel):
    decision_notes: Optional[str] = Field(None, max_length=500)

class ApprovalResponse(BaseModel):
    id: int
    execution_id: int
    requested_by_agent: str
    agent_name: Optional[str] = None
    tool_name: Optional[str] = None
    action_name: Optional[str] = "Unknown"
    amount: Optional[float] = None
    risk_score: Optional[int] = 0
    risk_level: Optional[RiskLevel] = RiskLevel.MEDIUM
    status: ApprovalStatus
    reason: Optional[str] = None
    decision_notes: Optional[str] = None
    requested_at: datetime
    decided_at: Optional[datetime] = None
    approved_by: Optional[int] = None
    approver_name: Optional[str] = None
    request_payload: Optional[Dict[str, Any]] = None
    sanitized_payload: Optional[Dict[str, Any]] = None
    pipeline_breakdown: Optional[Any] = None

    class Config:
        from_attributes = True

def build_approval_response(a) -> ApprovalResponse:
    exec_record = a.execution
    amount = None
    if exec_record and exec_record.request_payload:
        raw_amt = exec_record.request_payload.get("amount") or exec_record.request_payload.get("refund_amount")
        if raw_amt is not None:
            try:
                amount = float(raw_amt)
            except Exception:
                amount = None

    agent_name = exec_record.agent.name if (exec_record and exec_record.agent) else a.requested_by_agent
    tool_name = exec_record.tool.name if (exec_record and exec_record.tool) else "custom_tool"

    return ApprovalResponse(
        id=a.id,
        execution_id=a.execution_id,
        requested_by_agent=a.requested_by_agent,
        agent_name=agent_name,
        tool_name=tool_name,
        action_name=exec_record.action_name if exec_record else "Unknown",
        amount=amount,
        risk_score=exec_record.risk_score if exec_record else 80,
        risk_level=exec_record.risk_level if exec_record else RiskLevel.HIGH,
        status=a.status,
        reason=a.reason,
        decision_notes=a.decision_notes,
        requested_at=a.requested_at,
        decided_at=a.decided_at,
        approved_by=a.approved_by,
        approver_name=a.approver.name if a.approver else None,
        request_payload=exec_record.request_payload if exec_record else {},
        sanitized_payload=exec_record.sanitized_payload if exec_record else {},
        pipeline_breakdown=exec_record.pipeline_breakdown if exec_record else []
    )
