from datetime import datetime
from typing import Optional, List
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.security import decode_access_token, hash_api_key
from app.core.permissions import UserRole, UserStatus
from app.models.user import User
from app.models.api_key import APIKey
from app.models.agent import Agent

security_scheme = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided."
        )

    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token."
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token no longer exists."
        )

    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User account is currently {user.status.value}."
        )

    return user

def require_roles(allowed_roles: List[UserRole]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of [{', '.join([r.value for r in allowed_roles])}]"
            )
        return current_user
    return role_checker

# Predefined role dependencies
require_super_admin = require_roles([UserRole.SUPER_ADMIN])
require_admin_or_above = require_roles([UserRole.SUPER_ADMIN, UserRole.ADMIN])
require_analyst_or_above = require_roles([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SECURITY_ANALYST])

async def authenticate_caller(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> dict:
    """
    Authenticates an execution gateway caller via either API Key or JWT User Token.
    Returns:
        {
            "auth_type": "API_KEY" | "JWT_USER",
            "user": User or None,
            "api_key": APIKey or None,
            "agent_id": int or None
        }
    """
    if x_api_key:
        hashed = hash_api_key(x_api_key)
        api_key_record = db.query(APIKey).filter(APIKey.hashed_key == hashed, APIKey.is_active == True).first()
        if not api_key_record:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or inactive API Key provided."
            )
        
        if api_key_record.expires_at and api_key_record.expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="The provided API Key has expired."
            )

        # Update last used timestamp
        api_key_record.last_used_at = datetime.utcnow()
        db.commit()

        return {
            "auth_type": "API_KEY",
            "user": api_key_record.user,
            "api_key": api_key_record,
            "agent_id": api_key_record.agent_id
        }

    if credentials and credentials.credentials:
        payload = decode_access_token(credentials.credentials)
        if payload and "sub" in payload:
            user = db.query(User).filter(User.id == int(payload["sub"])).first()
            if user and user.status == UserStatus.ACTIVE:
                return {
                    "auth_type": "JWT_USER",
                    "user": user,
                    "api_key": None,
                    "agent_id": None
                }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Provide a valid 'X-API-Key' header or 'Bearer' JWT token."
    )
