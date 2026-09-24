from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class APIKeyCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    agent_id: Optional[int] = None
    expires_in_days: Optional[int] = Field(None, ge=1, le=365)

class APIKeyCreatedResponse(BaseModel):
    id: int
    name: str
    prefix: str
    api_key: str  # Only returned upon initial creation
    agent_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime] = None
    message: str = "Store this API key securely now. You will not be able to view it again."

class APIKeyResponse(BaseModel):
    id: int
    name: str
    prefix: str
    agent_id: Optional[int] = None
    agent_name: Optional[str] = None
    is_active: bool
    last_used_at: Optional[datetime] = None
    created_at: datetime
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True
