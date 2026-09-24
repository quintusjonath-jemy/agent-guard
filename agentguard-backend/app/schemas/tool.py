from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.core.permissions import RiskLevel, PermissionType

class ToolCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    tool_type: str = "API"
    endpoint: Optional[str] = None
    risk_level: RiskLevel = RiskLevel.LOW
    required_permission: PermissionType = PermissionType.READ
    requires_approval: bool = False
    enabled: bool = True

class ToolUpdateRequest(BaseModel):
    description: Optional[str] = None
    tool_type: Optional[str] = None
    endpoint: Optional[str] = None
    risk_level: Optional[RiskLevel] = None
    required_permission: Optional[PermissionType] = None
    requires_approval: Optional[bool] = None
    enabled: Optional[bool] = None

class ToolResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    tool_type: str
    endpoint: Optional[str] = None
    risk_level: RiskLevel
    required_permission: PermissionType
    requires_approval: bool
    enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True
