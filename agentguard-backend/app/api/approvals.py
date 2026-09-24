from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.approval import Approval
from app.models.execution import Execution
from app.models.user import User
from app.core.permissions import ApprovalStatus
from app.schemas.approval import ApprovalResponse, ApprovalDecisionRequest, build_approval_response
from app.schemas.common import ApiResponse
from app.api.deps import get_current_user, require_analyst_or_above
from app.services.approval_service import approval_service

router = APIRouter(prefix="/approvals", tags=["Approvals"])

@router.get("", response_model=ApiResponse[List[ApprovalResponse]])
def list_approvals(
    status_filter: Optional[ApprovalStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Approval).order_by(Approval.requested_at.desc())
    if status_filter:
        query = query.filter(Approval.status == status_filter)
    
    approvals = query.all()
    results = [build_approval_response(a) for a in approvals]
    return ApiResponse(success=True, data=results)

@router.get("/{approval_id}", response_model=ApiResponse[ApprovalResponse])
def get_approval(
    approval_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    a = db.query(Approval).filter(Approval.id == approval_id).first()
    if not a:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval not found.")

    return ApiResponse(
        success=True,
        data=build_approval_response(a)
    )

@router.post("/{approval_id}/approve", response_model=ApiResponse[ApprovalResponse])
def approve_action(
    approval_id: int,
    request: Request,
    payload: ApprovalDecisionRequest = ApprovalDecisionRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_above)
):
    client_ip = request.client.host if request.client else "127.0.0.1"
    approval = approval_service.approve_execution(
        db=db,
        approval_id=approval_id,
        approver=current_user,
        decision_notes=payload.decision_notes,
        client_ip=client_ip
    )
    return ApiResponse(
        success=True,
        message="Action approved and executed successfully.",
        data=build_approval_response(approval)
    )

@router.post("/{approval_id}/reject", response_model=ApiResponse[ApprovalResponse])
def reject_action(
    approval_id: int,
    request: Request,
    payload: ApprovalDecisionRequest = ApprovalDecisionRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_above)
):
    client_ip = request.client.host if request.client else "127.0.0.1"
    approval = approval_service.reject_execution(
        db=db,
        approval_id=approval_id,
        approver=current_user,
        decision_notes=payload.decision_notes,
        client_ip=client_ip
    )
    return ApiResponse(
        success=True,
        message="Action rejected and stopped.",
        data=build_approval_response(approval)
    )
