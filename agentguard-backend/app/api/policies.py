from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.policy import Policy
from app.models.agent import Agent
from app.models.tool import Tool
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.policy import PolicyCreateRequest, PolicyUpdateRequest, PolicyResponse, PolicySimulateRequest, PolicySimulateResponse
from app.schemas.common import ApiResponse
from app.api.deps import get_current_user, require_admin_or_above, require_analyst_or_above
from app.services.permission_service import permission_service
from app.services.sensitive_data_service import sensitive_data_service
from app.services.policy_engine import policy_engine
from app.services.risk_engine import risk_engine

router = APIRouter(prefix="/policies", tags=["Policies"])

@router.get("", response_model=ApiResponse[List[PolicyResponse]])
def list_policies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    policies = db.query(Policy).order_by(Policy.created_at.desc()).all()
    return ApiResponse(
        success=True,
        data=[PolicyResponse.model_validate(p) for p in policies]
    )

@router.get("/{policy_id}", response_model=ApiResponse[PolicyResponse])
def get_policy(
    policy_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found.")
    return ApiResponse(success=True, data=PolicyResponse.model_validate(policy))

@router.post("", response_model=ApiResponse[PolicyResponse], status_code=status.HTTP_201_CREATED)
def create_policy(
    request: Request,
    payload: PolicyCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    existing = db.query(Policy).filter(Policy.name == payload.name.strip()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A policy with this name already exists.")

    policy = Policy(
        name=payload.name.strip(),
        description=payload.description,
        policy_type=payload.policy_type,
        rule_definition=payload.rule_definition,
        severity=payload.severity,
        enabled=payload.enabled,
        created_by=current_user.id
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)

    # Audit event
    audit = AuditLog(
        user_id=current_user.id,
        event_type="POLICY_CREATED",
        action="create_policy",
        decision="ALLOWED",
        risk_level="LOW",
        description=f"Admin {current_user.email} created policy '{policy.name}' ({policy.policy_type.value})",
        ip_address=request.client.host if request.client else "127.0.0.1",
        metadata_json={"policy_id": policy.id, "policy_type": policy.policy_type.value}
    )
    db.add(audit)
    db.commit()

    return ApiResponse(
        success=True,
        message="Policy created successfully.",
        data=PolicyResponse.model_validate(policy)
    )

@router.put("/{policy_id}", response_model=ApiResponse[PolicyResponse])
def update_policy(
    policy_id: int,
    request: Request,
    payload: PolicyUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found.")

    if payload.name is not None:
        policy.name = payload.name.strip()
    if payload.description is not None:
        policy.description = payload.description
    if payload.rule_definition is not None:
        policy.rule_definition = payload.rule_definition
    if payload.severity is not None:
        policy.severity = payload.severity
    if payload.enabled is not None:
        policy.enabled = payload.enabled

    db.commit()
    db.refresh(policy)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        event_type="POLICY_UPDATED",
        action="update_policy",
        decision="ALLOWED",
        risk_level="LOW",
        description=f"Admin {current_user.email} modified policy '{policy.name}'",
        ip_address=request.client.host if request.client else "127.0.0.1",
        metadata_json={"policy_id": policy.id}
    )
    db.add(audit)
    db.commit()

    return ApiResponse(
        success=True,
        message="Policy updated successfully.",
        data=PolicyResponse.model_validate(policy)
    )

@router.delete("/{policy_id}", response_model=ApiResponse[dict])
def delete_policy(
    policy_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_above)
):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Policy not found.")

    pol_name = policy.name
    db.delete(policy)
    db.commit()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        event_type="POLICY_DELETED",
        action="delete_policy",
        decision="ALLOWED",
        risk_level="MEDIUM",
        description=f"Admin {current_user.email} removed policy '{pol_name}'",
        ip_address=request.client.host if request.client else "127.0.0.1",
        metadata_json={"deleted_policy_name": pol_name}
    )
    db.add(audit)
    db.commit()

    return ApiResponse(success=True, message=f"Policy '{pol_name}' deleted successfully.")

@router.post("/simulate", response_model=ApiResponse[PolicySimulateResponse])
def simulate_policy_evaluation(
    payload: PolicySimulateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_above)
):
    """
    Policy Simulator endpoint for testing policy rules and risk outcomes in real time.
    """
    agent = db.query(Agent).filter(Agent.id == payload.agent_id).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")

    tool = db.query(Tool).filter(Tool.name == payload.tool_name).first()
    if not tool:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Tool '{payload.tool_name}' not found.")

    # 1. DLP Scan
    dlp_result = sensitive_data_service.scan_and_sanitize(payload.payload)

    # 2. Permission Evaluation
    perm_result = permission_service.evaluate_permission(db, agent, tool, payload.action, payload.payload)

    # 3. Policy Evaluation
    policy_result = policy_engine.evaluate(db, agent, tool, payload.action, payload.payload, perm_result, dlp_result)

    # 4. Risk Calculation
    risk_result = risk_engine.calculate_risk(agent, tool, payload.action, payload.payload, perm_result, dlp_result, policy_result)

    return ApiResponse(
        success=True,
        data=PolicySimulateResponse(
            decision=policy_result.decision,
            risk_score=risk_result.score,
            risk_level=risk_result.level,
            reasons=policy_result.reasons,
            requires_human_approval=policy_result.requires_human_approval,
            sensitive_data_detected=dlp_result.has_sensitive_data,
            findings=[f.model_dump() for f in dlp_result.findings],
            policy_violations=[v.model_dump() for v in policy_result.violations],
            risk_factors=[rf.model_dump() for rf in risk_result.factors]
        )
    )
