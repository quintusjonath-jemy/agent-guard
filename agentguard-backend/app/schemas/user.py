from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.core.permissions import UserRole, UserStatus
from app.schemas.auth import UserResponse

class UserCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    role: UserRole = UserRole.SECURITY_ANALYST
    status: UserStatus = UserStatus.ACTIVE

class UserUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    password: Optional[str] = Field(None, min_length=8, max_length=128)
