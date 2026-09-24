from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.incident import AuditLogResponse
from app.schemas.common import ApiResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=ApiResponse[List[AuditLogResponse]])
def list_audit_logs(
    event_type: Optional[str] = None,
    agent_id: Optional[int] = None,
    user_id: Optional[int] = None,
    decision: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AuditLog).order_by(AuditLog.created_at.desc())

    if event_type:
        query = query.filter(AuditLog.event_type == event_type)
    if agent_id:
        query = query.filter(AuditLog.agent_id == agent_id)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if decision:
        query = query.filter(AuditLog.decision == decision)
    if risk_level:
        query = query.filter(AuditLog.risk_level == risk_level)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (AuditLog.description.ilike(search_pattern)) | 
            (AuditLog.action.ilike(search_pattern)) |
            (AuditLog.event_type.ilike(search_pattern))
        )

    logs = query.limit(limit).all()
    results = []
    for log in logs:
        results.append(
            AuditLogResponse(
                id=log.id,
                user_id=log.user_id,
                user_name=log.user.name if log.user else None,
                agent_id=log.agent_id,
                agent_name=log.agent.name if getattr(log, 'agent', None) else None,
                event_type=log.event_type,
                action=log.action,
                decision=log.decision,
                risk_level=log.risk_level,
                description=log.description,
                metadata_json=log.metadata_json,
                ip_address=log.ip_address,
                created_at=log.created_at
            )
        )
    return ApiResponse(success=True, data=results)
