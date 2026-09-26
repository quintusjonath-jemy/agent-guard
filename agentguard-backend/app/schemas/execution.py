from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field, model_validator
from app.core.permissions import ExecutionDecision, RiskLevel

class ExecutionPipelineStep(BaseModel):
    name: str
    status: str  # "PASS" | "FAIL" | "WARN" | "REQUIRED"
    passed: bool
    details: Optional[str] = None

class ActionExecuteRequest(BaseModel):
    agent_id: int
    tool: str
    action: str
    payload: Dict[str, Any] = {}

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            values = dict(values)
            if "tool" not in values and "tool_name" in values:
                values["tool"] = values["tool_name"]
            if "action" not in values and "action_name" in values:
                values["action"] = values["action_name"]
            if "payload" not in values and "request_payload" in values:
                values["payload"] = values["request_payload"]
        return values

class ExecutionResponse(BaseModel):
    execution_id: int
    agent_id: int
    agent_name: str
    tool_id: Optional[int] = None
    tool_name: str
    action_name: str
    decision: ExecutionDecision
    risk_score: int
    risk_level: RiskLevel
    reason: Optional[str] = None
    pipeline_breakdown: List[ExecutionPipelineStep]
    execution_status: str
    sanitized_payload: Dict[str, Any]
    response_payload: Optional[Dict[str, Any]] = None
    approval_required: bool = False
    duration_ms: float
    created_at: datetime

class ExecutionListItem(BaseModel):
    id: int
    agent_id: int
    agent_name: str
    tool_id: Optional[int] = None
    tool_name: str
    action_name: str
    decision: ExecutionDecision
    risk_score: int
    risk_level: RiskLevel
    reason: Optional[str] = None
    execution_status: str
    duration_ms: float
    created_at: datetime

    class Config:
        from_attributes = True

class ExecutionDetailResponse(BaseModel):
    id: int
    execution_id: Optional[int] = None
    agent_id: int
    agent_name: str
    provider: str
    environment: str
    tool_id: Optional[int] = None
    tool_name: str
    action_name: str
    request_payload: Dict[str, Any]
    sanitized_payload: Dict[str, Any]
    decision: ExecutionDecision
    risk_score: int
    risk_level: RiskLevel
    reason: Optional[str] = None
    plain_english_explanation: str
    pipeline_breakdown: List[ExecutionPipelineStep]
    execution_status: str
    response_payload: Optional[Dict[str, Any]] = None
    duration_ms: float
    created_at: datetime
    approval: Optional[Dict[str, Any]] = None
