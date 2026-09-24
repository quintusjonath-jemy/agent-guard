from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.incident import Incident
from app.models.audit_log import AuditLog
from app.models.user import User
from app.core.permissions import IncidentStatus, IncidentSeverity
from app.schemas.incident import IncidentResponse, IncidentUpdateRequest
from app.schemas.common import ApiResponse
from app.api.deps import get_current_user, require_analyst_or_above
from app.core.websocket import ws_manager

router = APIRouter(prefix="/incidents", tags=["Incident Management"])

@router.get("", response_model=ApiResponse[List[IncidentResponse]])
def list_incidents(
    status_filter: Optional[IncidentStatus] = None,
    severity_filter: Optional[IncidentSeverity] = None,
    agent_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Incident).order_by(Incident.detected_at.desc())
    if status_filter:
        query = query.filter(Incident.status == status_filter)
    if severity_filter:
        query = query.filter(Incident.severity == severity_filter)
    if agent_id:
        query = query.filter(Incident.agent_id == agent_id)

    incidents = query.all()
    results = []
    for inc in incidents:
        results.append(
            IncidentResponse(
                id=inc.id,
                title=inc.title,
                description=inc.description,
                severity=inc.severity,
                agent_id=inc.agent_id,
                agent_name=inc.agent.name if inc.agent else "Unknown Agent",
                execution_id=inc.execution_id,
                status=inc.status,
                assigned_to=inc.assigned_to,
                assignee_name=inc.assignee.name if inc.assignee else None,
                analyst_notes=inc.analyst_notes,
                detected_at=inc.detected_at,
                resolved_at=inc.resolved_at
            )
        )
    return ApiResponse(success=True, data=results)

@router.get("/{incident_id}", response_model=ApiResponse[IncidentResponse])
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found.")

    return ApiResponse(
        success=True,
        data=IncidentResponse(
            id=inc.id,
            title=inc.title,
            description=inc.description,
            severity=inc.severity,
            agent_id=inc.agent_id,
            agent_name=inc.agent.name if inc.agent else "Unknown Agent",
            execution_id=inc.execution_id,
            status=inc.status,
            assigned_to=inc.assigned_to,
            assignee_name=inc.assignee.name if inc.assignee else None,
            analyst_notes=inc.analyst_notes,
            detected_at=inc.detected_at,
            resolved_at=inc.resolved_at
        )
    )

@router.put("/{incident_id}", response_model=ApiResponse[IncidentResponse])
def update_incident(
    incident_id: int,
    request: Request,
    payload: IncidentUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_above)
):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found.")

    if payload.status is not None:
        inc.status = payload.status
        if payload.status == IncidentStatus.RESOLVED and not inc.resolved_at:
            inc.resolved_at = datetime.utcnow()

    if payload.assigned_to is not None:
        inc.assigned_to = payload.assigned_to

    if payload.analyst_notes is not None:
        timestamp_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        formatted_note = f"[{timestamp_str} - {current_user.name}]: {payload.analyst_notes}"
        if inc.analyst_notes:
            inc.analyst_notes = f"{inc.analyst_notes}\n{formatted_note}"
        else:
            inc.analyst_notes = formatted_note

    db.commit()
    db.refresh(inc)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        agent_id=inc.agent_id,
        event_type="INCIDENT_UPDATED",
        action="update_incident",
        decision="ALLOWED",
        risk_level="LOW",
        description=f"Analyst {current_user.email} updated incident #{inc.id} status to '{inc.status.value}'",
        ip_address=request.client.host if request.client else "127.0.0.1",
        metadata_json={"incident_id": inc.id, "status": inc.status.value}
    )
    db.add(audit)
    db.commit()

    # Broadcast real-time incident update
    ws_manager.sync_broadcast(
        "INCIDENT_UPDATED",
        {
            "incident_id": inc.id,
            "status": inc.status.value,
            "title": inc.title,
            "updated_by": current_user.name,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

    return ApiResponse(
        success=True,
        message="Incident updated successfully.",
        data=IncidentResponse(
            id=inc.id,
            title=inc.title,
            description=inc.description,
            severity=inc.severity,
            agent_id=inc.agent_id,
            agent_name=inc.agent.name if inc.agent else "Unknown Agent",
            execution_id=inc.execution_id,
            status=inc.status,
            assigned_to=inc.assigned_to,
            assignee_name=inc.assignee.name if inc.assignee else None,
            analyst_notes=inc.analyst_notes,
            detected_at=inc.detected_at,
            resolved_at=inc.resolved_at
        )
    )
