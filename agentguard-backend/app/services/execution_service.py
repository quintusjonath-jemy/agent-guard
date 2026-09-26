import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.agent import Agent
from app.models.tool import Tool
from app.models.execution import Execution
from app.models.approval import Approval
from app.models.audit_log import AuditLog
from app.models.incident import Incident
from app.core.permissions import ExecutionDecision, RiskLevel, ApprovalStatus, IncidentStatus, IncidentSeverity
from app.services.permission_service import permission_service
from app.services.sensitive_data_service import sensitive_data_service
from app.services.policy_engine import policy_engine
from app.services.risk_engine import risk_engine
from app.services.mock_tool_service import mock_tool_service
from app.core.websocket import ws_manager
from app.schemas.execution import ActionExecuteRequest, ExecutionResponse, ExecutionPipelineStep
from app.core.logging import logger

class ExecutionService:
    def process_action(
        self,
        db: Session,
        request: ActionExecuteRequest,
        auth_context: Dict[str, Any],
        client_ip: str = "127.0.0.1"
    ) -> ExecutionResponse:
        start_time = time.time()
        pipeline_steps: List[ExecutionPipelineStep] = []

        # 1. Authentication Step
        pipeline_steps.append(
            ExecutionPipelineStep(
                name="Authentication & Identity",
                status="PASS",
                passed=True,
                details=f"Authenticated via {auth_context.get('auth_type', 'API_KEY')}"
            )
        )

        # 2. Agent Validation
        agent = db.query(Agent).filter(Agent.id == request.agent_id).first()
        if not agent:
            pipeline_steps.append(
                ExecutionPipelineStep(
                    name="Agent Identification",
                    status="FAIL",
                    passed=False,
                    details=f"Agent with ID {request.agent_id} not found"
                )
            )
            duration_ms = round((time.time() - start_time) * 1000, 2)
            return self._record_failed_execution(db, request, "Agent not found", pipeline_steps, duration_ms)

        pipeline_steps.append(
            ExecutionPipelineStep(
                name="Agent Identification",
                status="PASS",
                passed=True,
                details=f"Identified agent '{agent.name}' (Status: {agent.status.value})"
            )
        )

        # 3. Tool Validation
        tool = db.query(Tool).filter(Tool.name == request.tool).first()
        if not tool or not tool.enabled:
            pipeline_steps.append(
                ExecutionPipelineStep(
                    name="Tool Validation",
                    status="FAIL",
                    passed=False,
                    details=f"Tool '{request.tool}' not found or disabled"
                )
            )
            duration_ms = round((time.time() - start_time) * 1000, 2)
            return self._record_failed_execution(db, request, f"Tool '{request.tool}' unavailable", pipeline_steps, duration_ms, agent.id)

        pipeline_steps.append(
            ExecutionPipelineStep(
                name="Tool Authorization",
                status="PASS",
                passed=True,
                details=f"Tool '{tool.name}' validated ({tool.tool_type})"
            )
        )

        # 4. DLP / Sensitive Data Scan
        dlp_result = sensitive_data_service.scan_and_sanitize(request.payload)
        sanitized_payload = dlp_result.sanitized_payload

        if dlp_result.has_sensitive_data:
            crit_findings = [f for f in dlp_result.findings if f.severity in [RiskLevel.HIGH, RiskLevel.CRITICAL]]
            if crit_findings:
                pipeline_steps.append(
                    ExecutionPipelineStep(
                        name="Sensitive Data (DLP) Scan",
                        status="FAIL",
                        passed=False,
                        details=f"Detected sensitive secrets ({crit_findings[0].finding_type})"
                    )
                )
            else:
                pipeline_steps.append(
                    ExecutionPipelineStep(
                        name="Sensitive Data (DLP) Scan",
                        status="WARN",
                        passed=True,
                        details=f"Detected PII ({dlp_result.findings[0].finding_type})"
                    )
                )
        else:
            pipeline_steps.append(
                ExecutionPipelineStep(
                    name="Sensitive Data (DLP) Scan",
                    status="PASS",
                    passed=True,
                    details="No sensitive credentials or leaks found"
                )
            )

        # 5. Permission Check
        perm_result = permission_service.evaluate_permission(db, agent, tool, request.action, request.payload)
        if not perm_result.allowed:
            pipeline_steps.append(
                ExecutionPipelineStep(
                    name="Permission & Least Privilege",
                    status="FAIL",
                    passed=False,
                    details=perm_result.reason
                )
            )
        else:
            pipeline_steps.append(
                ExecutionPipelineStep(
                    name="Permission & Least Privilege",
                    status="PASS",
                    passed=True,
                    details="Agent has verified least-privilege permission"
                )
            )

        # 6. Policy Engine Evaluation
        policy_result = policy_engine.evaluate(db, agent, tool, request.action, request.payload, perm_result, dlp_result)
        if policy_result.violations:
            pipeline_steps.append(
                ExecutionPipelineStep(
                    name="Policy Engine Evaluation",
                    status="FAIL" if policy_result.decision == ExecutionDecision.BLOCKED else "WARN",
                    passed=policy_result.decision != ExecutionDecision.BLOCKED,
                    details=f"Violated: {policy_result.violations[0].policy_name}"
                )
            )
        else:
            pipeline_steps.append(
                ExecutionPipelineStep(
                    name="Policy Engine Evaluation",
                    status="PASS",
                    passed=True,
                    details="All configured governance policies satisfied"
                )
            )

        # 7. Risk Engine Scoring
        risk_result = risk_engine.calculate_risk(agent, tool, request.action, request.payload, perm_result, dlp_result, policy_result)
        pipeline_steps.append(
            ExecutionPipelineStep(
                name="Risk Engine Scoring",
                status="WARN" if risk_result.level in [RiskLevel.HIGH, RiskLevel.CRITICAL] else "PASS",
                passed=True,
                details=f"Score: {risk_result.score}/100 ({risk_result.level.value})"
            )
        )

        # 8. Human Approval & Final Decision
        final_decision = policy_result.decision
        requires_approval = policy_result.requires_human_approval

        if requires_approval:
            pipeline_steps.append(
                ExecutionPipelineStep(
                    name="Human Approval Gate",
                    status="REQUIRED",
                    passed=False,
                    details="Action requires supervisor approval before execution"
                )
            )
        else:
            pipeline_steps.append(
                ExecutionPipelineStep(
                    name="Human Approval Gate",
                    status="PASS",
                    passed=True,
                    details="Action pre-authorized within safe policy limits"
                )
            )

        # Final decision step
        pipeline_steps.append(
            ExecutionPipelineStep(
                name="Final Decision",
                status="PASS" if final_decision == ExecutionDecision.ALLOWED else ("WARN" if final_decision == ExecutionDecision.PENDING_APPROVAL else "FAIL"),
                passed=final_decision == ExecutionDecision.ALLOWED,
                details=f"Action state: {final_decision.value}"
            )
        )

        # Execute safe tool if ALLOWED
        response_payload = None
        execution_status = "COMPLETED"
        if final_decision == ExecutionDecision.ALLOWED:
            mock_res = mock_tool_service.execute_tool(tool.name, request.action, sanitized_payload)
            response_payload = mock_res.model_dump()
        elif final_decision == ExecutionDecision.PENDING_APPROVAL:
            execution_status = "PENDING_APPROVAL"
        else:
            execution_status = "BLOCKED"

        duration_ms = round((time.time() - start_time) * 1000, 2)
        primary_reason = policy_result.reasons[0] if policy_result.reasons else "Action evaluated."

        # Persist Execution Record
        execution = Execution(
            agent_id=agent.id,
            tool_id=tool.id,
            action_name=request.action,
            request_payload=request.payload,
            sanitized_payload=sanitized_payload,
            decision=final_decision,
            risk_score=risk_result.score,
            risk_level=risk_result.level,
            reason=primary_reason,
            pipeline_breakdown=[step.model_dump() for step in pipeline_steps],
            execution_status=execution_status,
            response_payload=response_payload,
            duration_ms=duration_ms,
            created_at=datetime.utcnow()
        )
        db.add(execution)
        db.commit()
        db.refresh(execution)

        # Handle PENDING_APPROVAL: Create Approval Entry
        if final_decision == ExecutionDecision.PENDING_APPROVAL:
            approval = Approval(
                execution_id=execution.id,
                requested_by_agent=agent.name,
                status=ApprovalStatus.PENDING,
                reason=primary_reason,
                requested_at=datetime.utcnow()
            )
            db.add(approval)
            db.commit()
            db.refresh(approval)

            # Broadcast WebSocket event
            ws_manager.sync_broadcast(
                "APPROVAL_REQUESTED",
                {
                    "approval_id": approval.id,
                    "execution_id": execution.id,
                    "agent_name": agent.name,
                    "action_name": request.action,
                    "risk_score": risk_result.score,
                    "risk_level": risk_result.level.value,
                    "reason": primary_reason,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )

        # Handle BLOCKED: Create SOC Incident if HIGH or CRITICAL risk
        if final_decision == ExecutionDecision.BLOCKED and risk_result.level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
            incident = Incident(
                title=f"Blocked High-Risk Action: {agent.name} -> {tool.name}",
                description=f"Agent '{agent.name}' attempted unauthorized action '{request.action}'. Risk Score: {risk_result.score}. Reason: {primary_reason}",
                severity=IncidentSeverity.CRITICAL if risk_result.level == RiskLevel.CRITICAL else IncidentSeverity.HIGH,
                agent_id=agent.id,
                execution_id=execution.id,
                status=IncidentStatus.OPEN,
                detected_at=datetime.utcnow()
            )
            db.add(incident)
            db.commit()

            # Broadcast Incident Alert
            ws_manager.sync_broadcast(
                "INCIDENT_CREATED",
                {
                    "incident_id": incident.id,
                    "title": incident.title,
                    "severity": incident.severity.value,
                    "agent_name": agent.name,
                    "risk_score": risk_result.score,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )

        # Immutable Audit Log
        audit = AuditLog(
            agent_id=agent.id,
            user_id=auth_context.get("user").id if auth_context.get("user") else None,
            event_type="ACTION_EXECUTED" if final_decision == ExecutionDecision.ALLOWED else "ACTION_BLOCKED",
            action=request.action,
            decision=final_decision.value,
            risk_level=risk_result.level.value,
            description=f"Agent '{agent.name}' requested '{tool.name}': {final_decision.value} (Risk: {risk_result.score})",
            ip_address=client_ip,
            metadata_json={
                "execution_id": execution.id,
                "tool": tool.name,
                "risk_score": risk_result.score,
                "reasons": policy_result.reasons
            }
        )
        db.add(audit)
        db.commit()

        # Broadcast live execution to WebSocket feed
        ws_manager.sync_broadcast(
            "LIVE_SECURITY_EVENT",
            {
                "execution_id": execution.id,
                "agent_name": agent.name,
                "tool_name": tool.name,
                "action_name": request.action,
                "decision": final_decision.value,
                "risk_score": risk_result.score,
                "risk_level": risk_result.level.value,
                "reason": primary_reason,
                "duration_ms": duration_ms,
                "timestamp": datetime.utcnow().isoformat()
            }
        )

        return ExecutionResponse(
            execution_id=execution.id,
            agent_id=agent.id,
            agent_name=agent.name,
            tool_id=tool.id,
            tool_name=tool.name,
            action_name=request.action,
            decision=final_decision,
            risk_score=risk_result.score,
            risk_level=risk_result.level,
            reason=primary_reason,
            pipeline_breakdown=pipeline_steps,
            execution_status=execution_status,
            sanitized_payload=sanitized_payload,
            response_payload=response_payload,
            approval_required=requires_approval,
            duration_ms=duration_ms,
            created_at=execution.created_at
        )

    def _record_failed_execution(
        self,
        db: Session,
        request: ActionExecuteRequest,
        reason: str,
        steps: List[ExecutionPipelineStep],
        duration_ms: float,
        agent_id: Optional[int] = None
    ) -> ExecutionResponse:
        execution = Execution(
            agent_id=agent_id or request.agent_id,
            action_name=request.action,
            request_payload=request.payload,
            sanitized_payload=request.payload,
            decision=ExecutionDecision.FAILED,
            risk_score=50,
            risk_level=RiskLevel.MEDIUM,
            reason=reason,
            pipeline_breakdown=[s.model_dump() for s in steps],
            execution_status="FAILED",
            duration_ms=duration_ms,
            created_at=datetime.utcnow()
        )
        db.add(execution)
        db.commit()
        db.refresh(execution)

        return ExecutionResponse(
            execution_id=execution.id,
            agent_id=request.agent_id,
            agent_name="Unknown Agent",
            tool_id=None,
            tool_name=request.tool,
            action_name=request.action,
            decision=ExecutionDecision.FAILED,
            risk_score=50,
            risk_level=RiskLevel.MEDIUM,
            reason=reason,
            pipeline_breakdown=steps,
            execution_status="FAILED",
            sanitized_payload=request.payload,
            response_payload=None,
            approval_required=False,
            duration_ms=duration_ms,
            created_at=execution.created_at
        )

execution_service = ExecutionService()
