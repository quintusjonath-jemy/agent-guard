from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.core.permissions import IncidentStatus, IncidentSeverity

class IncidentUpdateRequest(BaseModel):
    status: Optional[IncidentStatus] = None
    assigned_to: Optional[int] = None
    analyst_notes: Optional[str] = Field(None, max_length=2000)

class IncidentResponse(BaseModel):
    id: int
    title: str
    description: str
    severity: IncidentSeverity
    agent_id: int
    agent_name: str
    execution_id: Optional[int] = None
    status: IncidentStatus
    assigned_to: Optional[int] = None
    assignee_name: Optional[str] = None
    analyst_notes: Optional[str] = None
    detected_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    agent_id: Optional[int] = None
    agent_name: Optional[str] = None
    event_type: str
    action: str
    decision: Optional[str] = None
    risk_level: Optional[str] = None
    description: str
    metadata_json: Optional[Dict[str, Any]] = None
    ip_address: str
    created_at: datetime

    class Config:
        from_attributes = True

class RiskDistributionResponse(BaseModel):
    low: int
    medium: int
    high: int
    critical: int
    total: int

class DashboardStatsResponse(BaseModel):
    active_agents: int
    total_agents: Optional[int] = 0
    active_policies: Optional[int] = 0
    active_tools: Optional[int] = 0
    actions_today: int
    executions_today: Optional[int] = None
    blocked_today: int
    pending_approvals: int
    open_incidents: int
    security_score: int
    system_status: str
    risk_distribution: Optional[RiskDistributionResponse] = None
    timestamp: datetime

class SecurityTrendPoint(BaseModel):
    timestamp: str
    allowed: int
    blocked: int
    pending: int

class RiskyAgentLeaderboardItem(BaseModel):
    agent_id: int
    agent_name: str
    provider: str
    environment: str
    risk_level: str
    blocked_actions: int
    policy_violations: int
    security_score: int
    status: str
    last_activity: Optional[datetime] = None

class HeatmapCell(BaseModel):
    agent_name: str
    hour: str
    risk_score: int
    event_count: int
