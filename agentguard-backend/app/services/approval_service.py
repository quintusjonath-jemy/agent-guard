from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.approval import Approval
from app.models.execution import Execution
from app.models.audit_log import AuditLog
from app.models.user import User
from app.core.permissions import ApprovalStatus, ExecutionDecision
from app.services.mock_tool_service import mock_tool_service
from app.core.websocket import ws_manager
from app.core.logging import logger

class ApprovalService:
    def approve_execution(
        self,
        db: Session,
        approval_id: int,
        approver: User,
        decision_notes: Optional[str] = None,
        client_ip: str = "127.0.0.1"
    ) -> Approval:
        approval = db.query(Approval).filter(Approval.id == approval_id).first()
        if not approval:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval request not found.")

        if approval.status != ApprovalStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Approval request is already in '{approval.status.value}' state."
            )

        execution = approval.execution
        if not execution:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated execution not found.")

        # Execute the tool now that supervisor approval was granted
        tool_name = execution.tool.name if execution.tool else "custom_action"
        mock_result = mock_tool_service.execute_tool(
            tool_name=tool_name,
            action_name=execution.action_name,
            payload=execution.request_payload or {}
        )

        # Update Approval Record
        approval.status = ApprovalStatus.APPROVED
        approval.approved_by = approver.id
        approval.decision_notes = decision_notes or "Supervisor approved action."
        approval.decided_at = datetime.utcnow()

        # Update Execution Record
        execution.decision = ExecutionDecision.ALLOWED
        execution.execution_status = "COMPLETED"
        execution.response_payload = mock_result.model_dump()
        execution.reason = f"Approved by security analyst {approver.name}: {approval.decision_notes}"

        db.commit()
        db.refresh(approval)

        # Audit Log
        audit = AuditLog(
            user_id=approver.id,
            agent_id=execution.agent_id,
            event_type="APPROVAL_APPROVED",
            action="approve",
            decision="ALLOWED",
            risk_level=execution.risk_level.value,
            description=f"Analyst {approver.email} approved execution #{execution.id} for agent '{execution.agent.name}'",
            ip_address=client_ip,
            metadata_json={
                "approval_id": approval.id,
                "execution_id": execution.id,
                "notes": decision_notes
            }
        )
        db.add(audit)
        db.commit()

        # Broadcast live event
        ws_manager.sync_broadcast(
            "APPROVAL_DECIDED",
            {
                "approval_id": approval.id,
                "execution_id": execution.id,
                "status": "APPROVED",
                "approver_name": approver.name,
                "agent_name": execution.agent.name,
                "timestamp": datetime.utcnow().isoformat()
            }
        )

        return approval

    def reject_execution(
        self,
        db: Session,
        approval_id: int,
        approver: User,
        decision_notes: Optional[str] = None,
        client_ip: str = "127.0.0.1"
    ) -> Approval:
        approval = db.query(Approval).filter(Approval.id == approval_id).first()
        if not approval:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval request not found.")

        if approval.status != ApprovalStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Approval request is already in '{approval.status.value}' state."
            )

        execution = approval.execution
        if not execution:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated execution not found.")

        # Update Approval Record
        approval.status = ApprovalStatus.REJECTED
        approval.approved_by = approver.id
        approval.decision_notes = decision_notes or "Supervisor rejected action."
        approval.decided_at = datetime.utcnow()

        # Update Execution Record
        execution.decision = ExecutionDecision.BLOCKED
        execution.execution_status = "BLOCKED"
        execution.reason = f"Rejected by supervisor {approver.name}: {approval.decision_notes}"

        db.commit()
        db.refresh(approval)

        # Audit Log
        audit = AuditLog(
            user_id=approver.id,
            agent_id=execution.agent_id,
            event_type="APPROVAL_REJECTED",
            action="reject",
            decision="BLOCKED",
            risk_level=execution.risk_level.value,
            description=f"Analyst {approver.email} rejected execution #{execution.id} for agent '{execution.agent.name}'",
            ip_address=client_ip,
            metadata_json={
                "approval_id": approval.id,
                "execution_id": execution.id,
                "notes": decision_notes
            }
        )
        db.add(audit)
        db.commit()

        # Broadcast live event
        ws_manager.sync_broadcast(
            "APPROVAL_DECIDED",
            {
                "approval_id": approval.id,
                "execution_id": execution.id,
                "status": "REJECTED",
                "approver_name": approver.name,
                "agent_name": execution.agent.name,
                "timestamp": datetime.utcnow().isoformat()
            }
        )

        return approval

approval_service = ApprovalService()
