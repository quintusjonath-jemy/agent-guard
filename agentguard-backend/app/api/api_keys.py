from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.security import generate_api_key
from app.models.user import User
from app.models.agent import Agent
from app.models.api_key import APIKey
from app.models.audit_log import AuditLog
from app.schemas.api_key import APIKeyCreateRequest, APIKeyCreatedResponse, APIKeyResponse
from app.schemas.common import ApiResponse
from app.api.deps import get_current_user, require_admin_or_above

router = APIRouter(prefix="/api-keys", tags=["API Key Management"])

@router.get("", response_model=ApiResponse[List[APIKeyResponse]])
def list_api_keys(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    keys = db.query(APIKey).order_by(APIKey.created_at.desc()).all()
    results = []
    for k in keys:
        agent_name = k.agent.name if k.agent else None
        results.append(
            APIKeyResponse(
                id=k.id,
                name=k.name,
                prefix=k.prefix,
                agent_id=k.agent_id,
                agent_name=agent_name,
                is_active=k.is_active,
                last_used_at=k.last_used_at,
                created_at=k.created_at,
                expires_at=k.expires_at
            )
        )
    return ApiResponse(success=True, data=results)

@router.post("", response_model=ApiResponse[APIKeyCreatedResponse], status_code=status.HTTP_201_CREATED)
def create_api_key(
    request: Request,
    payload: APIKeyCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    # Verify agent if specified
    if payload.agent_id:
        agent = db.query(Agent).filter(Agent.id == payload.agent_id).first()
        if not agent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specified Agent does not exist.")

    full_key, key_prefix, hashed_key = generate_api_key(prefix="ag_live")

    expires_at = None
    if payload.expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=payload.expires_in_days)

    new_api_key = APIKey(
        name=payload.name.strip(),
        prefix=key_prefix,
        hashed_key=hashed_key,
        user_id=current_user.id,
        agent_id=payload.agent_id,
        is_active=True,
        expires_at=expires_at
    )
    db.add(new_api_key)
    db.commit()
    db.refresh(new_api_key)

    # Audit event (Never log the raw API key secret)
    audit = AuditLog(
        user_id=current_user.id,
        agent_id=payload.agent_id,
        event_type="API_KEY_CREATED",
        action="create_api_key",
        decision="ALLOWED",
        risk_level="LOW",
        description=f"Generated new API Key '{new_api_key.name}' with prefix '{key_prefix}***'",
        ip_address=request.client.host if request.client else "127.0.0.1",
        metadata_json={"api_key_id": new_api_key.id, "prefix": key_prefix, "agent_id": payload.agent_id}
    )
    db.add(audit)
    db.commit()

    return ApiResponse(
        success=True,
        message="API Key created successfully. Copy and store this secret now.",
        data=APIKeyCreatedResponse(
            id=new_api_key.id,
            name=new_api_key.name,
            prefix=key_prefix,
            api_key=full_key,
            agent_id=new_api_key.agent_id,
            is_active=new_api_key.is_active,
            created_at=new_api_key.created_at,
            expires_at=new_api_key.expires_at
        )
    )

@router.delete("/{key_id}", response_model=ApiResponse[dict])
def revoke_api_key(
    key_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    key = db.query(APIKey).filter(APIKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API Key not found.")

    key_prefix = key.prefix
    key_name = key.name
    db.delete(key)
    db.commit()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        event_type="API_KEY_REVOKED",
        action="revoke_api_key",
        decision="ALLOWED",
        risk_level="MEDIUM",
        description=f"Revoked API Key '{key_name}' ({key_prefix}***)",
        ip_address=request.client.host if request.client else "127.0.0.1",
        metadata_json={"revoked_key_id": key_id, "prefix": key_prefix}
    )
    db.add(audit)
    db.commit()

    return ApiResponse(
        success=True,
        message=f"API Key '{key_name}' revoked successfully."
    )
