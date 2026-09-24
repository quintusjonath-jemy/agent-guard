from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.core.permissions import PolicyType, RiskLevel, ExecutionDecision

class PolicyCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    policy_type: PolicyType
    rule_definition: Dict[str, Any]
    severity: RiskLevel = RiskLevel.HIGH
    enabled: bool = True

class PolicyUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    rule_definition: Optional[Dict[str, Any]] = None
    severity: Optional[RiskLevel] = None
    enabled: Optional[bool] = None

class PolicyResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    policy_type: PolicyType
    rule_definition: Dict[str, Any]
    severity: RiskLevel
    enabled: bool
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PolicySimulateRequest(BaseModel):
    agent_id: int
    tool_name: str
    action: str
    payload: Dict[str, Any] = {}

class PolicySimulateResponse(BaseModel):
    decision: ExecutionDecision
    risk_score: int
    risk_level: RiskLevel
    reasons: List[str]
    requires_human_approval: bool
    sensitive_data_detected: bool
    findings: List[Dict[str, Any]]
    policy_violations: List[Dict[str, Any]]
    risk_factors: List[Dict[str, Any]]
