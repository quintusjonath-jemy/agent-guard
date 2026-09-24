from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from app.core.permissions import AgentStatus, RiskLevel, PermissionType
from app.schemas.tool import ToolResponse

class AgentCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    provider: str = "OpenAI"
    environment: str = "Production"
    status: AgentStatus = AgentStatus.ACTIVE
    risk_level: RiskLevel = RiskLevel.LOW
    tool_ids: List[int] = []
    permission_configs: List[Dict[str, Any]] = []  # [{"permission_type": "FINANCIAL", "max_amount": 10000.0}]

class AgentUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    provider: Optional[str] = None
    environment: Optional[str] = None
    status: Optional[AgentStatus] = None
    risk_level: Optional[RiskLevel] = None
    security_score: Optional[int] = Field(None, ge=0, le=100)

class AgentToolAssignRequest(BaseModel):
    tool_ids: List[int]

class AgentPermissionAssignRequest(BaseModel):
    permission_type: PermissionType
    max_amount: Optional[float] = None
    restrictions: Optional[Dict[str, Any]] = None
    enabled: bool = True

class AgentPermissionResponse(BaseModel):
    id: int
    permission_id: int
    permission_name: str
    max_amount: Optional[float] = None
    restrictions: Optional[Dict[str, Any]] = None
    enabled: bool

class AgentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    provider: str
    environment: str
    status: AgentStatus
    risk_level: RiskLevel
    security_score: int
    owner_id: Optional[int] = None
    tools_count: int = 0
    policies_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AgentDetailResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    provider: str
    environment: str
    status: AgentStatus
    risk_level: RiskLevel
    security_score: int
    owner_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    tools: List[ToolResponse] = []
    permissions: List[AgentPermissionResponse] = []
    recent_blocked_count: int = 0
    recent_incidents_count: int = 0
