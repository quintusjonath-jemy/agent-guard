from typing import Generic, TypeVar, Optional, Any, List
from pydantic import BaseModel, Field

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: Optional[str] = None
    data: Optional[T] = None
    error: Optional[dict] = None

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int

class HealthCheckResponse(BaseModel):
    status: str = "healthy"
    app_name: str = "AgentGuard"
    version: str = "1.0.0"
    environment: str
    database: str = "connected"
    timestamp: str
