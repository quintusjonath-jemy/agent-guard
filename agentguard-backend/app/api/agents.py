from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.agent import Agent
from app.models.tool import Tool
from app.models.agent_tool import AgentTool
from app.models.permission import Permission, AgentPermission
from app.models.execution import Execution
from app.models.incident import Incident
from app.models.audit_log import AuditLog
from app.models.user import User
from app.core.permissions import ExecutionDecision, IncidentStatus
from app.schemas.agent import (
    AgentCreateRequest,
    AgentUpdateRequest,
    AgentResponse,
    AgentDetailResponse,
    AgentToolAssignRequest,
    AgentPermissionAssignRequest,
    AgentPermissionResponse
)
from app.schemas.tool import ToolResponse
from app.schemas.common import ApiResponse
from app.api.deps import get_current_user, require_admin_or_above

router = APIRouter(prefix="/agents", tags=["Agents"])

@router.get("", response_model=ApiResponse[List[AgentResponse]])
def list_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agents = db.query(Agent).order_by(Agent.created_at.desc()).all()
    results = []
    for a in agents:
        tools_cnt = db.query(AgentTool).filter(AgentTool.agent_id == a.id, AgentTool.enabled == True).count()
        results.append(
            AgentResponse(
                id=a.id,
                name=a.name,
                description=a.description,
                provider=a.provider,
                environment=a.environment,
                status=a.status,
                risk_level=a.risk_level,
                security_score=a.security_score,
                owner_id=a.owner_id,
                tools_count=tools_cnt,
                policies_count=5,
                created_at=a.created_at,
                updated_at=a.updated_at
            )
        )
    return ApiResponse(success=True, data=results)

@router.get("/{agent_id}", response_model=ApiResponse[AgentDetailResponse])
def get_agent_detail(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")

    # Get Assigned Tools
    agent_tools = db.query(Tool).join(AgentTool).filter(
        AgentTool.agent_id == agent.id,
        AgentTool.enabled == True
    ).all()

    # Get Assigned Permissions
    agent_perms = db.query(AgentPermission).filter(
        AgentPermission.agent_id == agent.id
    ).all()

    perm_responses = []
    for ap in agent_perms:
        perm_responses.append(
            AgentPermissionResponse(
                id=ap.id,
                permission_id=ap.permission_id,
                permission_name=ap.permission.name.value if ap.permission else "UNKNOWN",
                max_amount=ap.max_amount,
                restrictions=ap.restrictions,
                enabled=ap.enabled
            )
        )

    # Counts
    blocked_count = db.query(Execution).filter(
        Execution.agent_id == agent.id,
        Execution.decision == ExecutionDecision.BLOCKED
    ).count()

    incidents_count = db.query(Incident).filter(
        Incident.agent_id == agent.id,
        Incident.status != IncidentStatus.RESOLVED
    ).count()

    return ApiResponse(
        success=True,
        data=AgentDetailResponse(
            id=agent.id,
            name=agent.name,
            description=agent.description,
            provider=agent.provider,
            environment=agent.environment,
            status=agent.status,
            risk_level=agent.risk_level,
            security_score=agent.security_score,
            owner_id=agent.owner_id,
            created_at=agent.created_at,
            updated_at=agent.updated_at,
            tools=[ToolResponse.model_validate(t) for t in agent_tools],
            permissions=perm_responses,
            recent_blocked_count=blocked_count,
            recent_incidents_count=incidents_count
        )
    )

@router.post("", response_model=ApiResponse[AgentResponse], status_code=status.HTTP_201_CREATED)
def create_agent(
    request: Request,
    payload: AgentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    existing = db.query(Agent).filter(Agent.name == payload.name.strip()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An agent with this name already exists.")

    agent = Agent(
        name=payload.name.strip(),
        description=payload.description,
        provider=payload.provider,
        environment=payload.environment,
        status=payload.status,
        risk_level=payload.risk_level,
        security_score=90,
        owner_id=current_user.id
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)

    # Assign tools if provided
    for t_id in payload.tool_ids:
        t = db.query(Tool).filter(Tool.id == t_id).first()
        if t:
            db.add(AgentTool(agent_id=agent.id, tool_id=t.id))

    # Assign permissions if provided
    for p_cfg in payload.permission_configs:
        p_type = p_cfg.get("permission_type")
        perm = db.query(Permission).filter(Permission.name == p_type).first()
        if perm:
            db.add(
                AgentPermission(
                    agent_id=agent.id,
                    permission_id=perm.id,
                    max_amount=p_cfg.get("max_amount"),
                    restrictions=p_cfg.get("restrictions"),
                    enabled=True
                )
            )

    db.commit()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        agent_id=agent.id,
        event_type="AGENT_REGISTERED",
        action="create_agent",
        decision="ALLOWED",
        risk_level="LOW",
        description=f"Admin {current_user.email} registered new AI agent '{agent.name}' ({agent.provider})",
        ip_address=request.client.host if request.client else "127.0.0.1",
        metadata_json={"agent_id": agent.id, "name": agent.name}
    )
    db.add(audit)
    db.commit()

    return ApiResponse(
        success=True,
        message="Agent registered successfully.",
        data=AgentResponse.model_validate(agent)
    )

@router.put("/{agent_id}", response_model=ApiResponse[AgentResponse])
def update_agent(
    agent_id: int,
    request: Request,
    payload: AgentUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")

    if payload.name is not None:
        agent.name = payload.name.strip()
    if payload.description is not None:
        agent.description = payload.description
    if payload.provider is not None:
        agent.provider = payload.provider
    if payload.environment is not None:
        agent.environment = payload.environment
    if payload.status is not None:
        agent.status = payload.status
    if payload.risk_level is not None:
        agent.risk_level = payload.risk_level
    if payload.security_score is not None:
        agent.security_score = payload.security_score

    db.commit()
    db.refresh(agent)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        agent_id=agent.id,
        event_type="AGENT_UPDATED",
        action="update_agent",
        decision="ALLOWED",
        risk_level="LOW",
        description=f"Admin {current_user.email} updated AI agent '{agent.name}'",
        ip_address=request.client.host if request.client else "127.0.0.1",
        metadata_json={"agent_id": agent.id}
    )
    db.add(audit)
    db.commit()

    return ApiResponse(
        success=True,
        message="Agent updated successfully.",
        data=AgentResponse.model_validate(agent)
    )

@router.post("/{agent_id}/tools", response_model=ApiResponse[dict])
def assign_tools_to_agent(
    agent_id: int,
    request: Request,
    payload: AgentToolAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")

    # Remove existing and assign new
    db.query(AgentTool).filter(AgentTool.agent_id == agent.id).delete()
    for t_id in payload.tool_ids:
        t = db.query(Tool).filter(Tool.id == t_id).first()
        if t:
            db.add(AgentTool(agent_id=agent.id, tool_id=t.id, enabled=True))

    db.commit()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        agent_id=agent.id,
        event_type="AGENT_TOOLS_UPDATED",
        action="assign_tools",
        decision="ALLOWED",
        risk_level="LOW",
        description=f"Updated tool assignments for agent '{agent.name}' ({len(payload.tool_ids)} tools)",
        ip_address=request.client.host if request.client else "127.0.0.1",
        metadata_json={"agent_id": agent.id, "tool_ids": payload.tool_ids}
    )
    db.add(audit)
    db.commit()

    return ApiResponse(success=True, message="Agent tools assigned successfully.")

@router.post("/{agent_id}/permissions", response_model=ApiResponse[dict])
def assign_permission_to_agent(
    agent_id: int,
    request: Request,
    payload: AgentPermissionAssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")

    perm = db.query(Permission).filter(Permission.name == payload.permission_type).first()
    if not perm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission type not found.")

    agent_perm = db.query(AgentPermission).filter(
        AgentPermission.agent_id == agent.id,
        AgentPermission.permission_id == perm.id
    ).first()

    if not agent_perm:
        agent_perm = AgentPermission(
            agent_id=agent.id,
            permission_id=perm.id,
            max_amount=payload.max_amount,
            restrictions=payload.restrictions,
            enabled=payload.enabled
        )
        db.add(agent_perm)
    else:
        agent_perm.max_amount = payload.max_amount
        agent_perm.restrictions = payload.restrictions
        agent_perm.enabled = payload.enabled

    db.commit()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        agent_id=agent.id,
        event_type="AGENT_PERMISSION_UPDATED",
        action="assign_permission",
        decision="ALLOWED",
        risk_level="MEDIUM",
        description=f"Updated permission '{payload.permission_type.value}' for agent '{agent.name}' (Limit: ₹{payload.max_amount or 'N/A'})",
        ip_address=request.client.host if request.client else "127.0.0.1",
        metadata_json={"agent_id": agent.id, "permission": payload.permission_type.value, "max_amount": payload.max_amount}
    )
    db.add(audit)
    db.commit()

    return ApiResponse(success=True, message="Agent permission configured successfully.")
