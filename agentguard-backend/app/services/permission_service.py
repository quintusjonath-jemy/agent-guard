from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models.agent import Agent
from app.models.tool import Tool
from app.models.permission import Permission, AgentPermission
from app.models.agent_tool import AgentTool
from app.core.permissions import PermissionType, AgentStatus
from app.core.logging import logger

class PermissionCheckResult(BaseModel):
    allowed: bool
    tool_assigned: bool
    permission_granted: bool
    limit_exceeded: bool
    requested_amount: Optional[float] = None
    configured_limit: Optional[float] = None
    reason: Optional[str] = None
    missing_permissions: List[str] = []

class PermissionService:
    def evaluate_permission(
        self,
        db: Session,
        agent: Agent,
        tool: Tool,
        action_name: str,
        payload: Dict[str, Any]
    ) -> PermissionCheckResult:
        """
        Deterministic least-privilege permission validation.
        """
        # 1. Check Agent Status
        if agent.status != AgentStatus.ACTIVE:
            return PermissionCheckResult(
                allowed=False,
                tool_assigned=False,
                permission_granted=False,
                limit_exceeded=False,
                reason=f"Agent '{agent.name}' is currently {agent.status.value}. Execution blocked."
            )

        # 2. Check if Tool is assigned to Agent
        agent_tool = db.query(AgentTool).filter(
            AgentTool.agent_id == agent.id,
            AgentTool.tool_id == tool.id,
            AgentTool.enabled == True
        ).first()

        if not agent_tool:
            return PermissionCheckResult(
                allowed=False,
                tool_assigned=False,
                permission_granted=False,
                limit_exceeded=False,
                reason=f"Agent '{agent.name}' does NOT have access to tool '{tool.name}'. Least-privilege violation.",
                missing_permissions=[f"TOOL_ASSIGNMENT:{tool.name}"]
            )

        # 3. Check Required Permission
        req_perm_type = tool.required_permission
        agent_perm = db.query(AgentPermission).join(Permission).filter(
            AgentPermission.agent_id == agent.id,
            Permission.name == req_perm_type,
            AgentPermission.enabled == True
        ).first()

        if not agent_perm:
            return PermissionCheckResult(
                allowed=False,
                tool_assigned=True,
                permission_granted=False,
                limit_exceeded=False,
                reason=f"Agent '{agent.name}' lacks required permission '{req_perm_type.value}' to perform '{action_name}'.",
                missing_permissions=[req_perm_type.value]
            )

        # 4. Check Financial Limits if operation involves financial amount
        if req_perm_type == PermissionType.FINANCIAL or "amount" in payload or "refund" in action_name.lower():
            # Extract amount from payload
            amount = None
            for key in ["amount", "refund_amount", "value", "total"]:
                if key in payload and isinstance(payload[key], (int, float)):
                    amount = float(payload[key])
                    break

            if amount is not None and agent_perm.max_amount is not None:
                if amount > agent_perm.max_amount:
                    return PermissionCheckResult(
                        allowed=False,
                        tool_assigned=True,
                        permission_granted=True,
                        limit_exceeded=True,
                        requested_amount=amount,
                        configured_limit=agent_perm.max_amount,
                        reason=f"Requested financial amount (₹{amount:,.2f}) exceeds configured agent limit (₹{agent_perm.max_amount:,.2f})."
                    )

        return PermissionCheckResult(
            allowed=True,
            tool_assigned=True,
            permission_granted=True,
            limit_exceeded=False,
            reason="Permission check passed."
        )

permission_service = PermissionService()
