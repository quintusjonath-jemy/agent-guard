from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.models.agent import Agent
from app.models.tool import Tool
from app.models.policy import Policy
from app.core.permissions import ExecutionDecision, PolicyType, RiskLevel
from app.services.permission_service import PermissionCheckResult
from app.services.sensitive_data_service import DLPScanResult
from app.core.logging import logger

class PolicyViolation(BaseModel):
    policy_id: Optional[int] = None
    policy_name: str
    policy_type: PolicyType
    severity: RiskLevel
    reason: str
    action_enforced: str

class PolicyEvaluationResult(BaseModel):
    decision: ExecutionDecision
    requires_human_approval: bool
    reasons: List[str]
    violations: List[PolicyViolation]
    risk_score_delta: int

class PolicyEngine:
    def evaluate(
        self,
        db: Session,
        agent: Agent,
        tool: Tool,
        action_name: str,
        payload: Dict[str, Any],
        perm_result: PermissionCheckResult,
        dlp_result: DLPScanResult
    ) -> PolicyEvaluationResult:
        """
        Evaluates all active policies against the agent execution request.
        """
        reasons: List[str] = []
        violations: List[PolicyViolation] = []
        requires_approval = False
        decision = ExecutionDecision.ALLOWED
        risk_delta = 0

        # Load all enabled system policies
        policies = db.query(Policy).filter(Policy.enabled == True).all()

        # 1. Evaluate DLP / Sensitive Data Violations
        if dlp_result.has_sensitive_data:
            crit_findings = [f for f in dlp_result.findings if f.severity in [RiskLevel.HIGH, RiskLevel.CRITICAL]]
            if crit_findings:
                reasons.append(f"Sensitive credentials or API keys detected in payload: {crit_findings[0].description}")
                violations.append(
                    PolicyViolation(
                        policy_name="Sensitive Data DLP Guard",
                        policy_type=PolicyType.SENSITIVE_DATA,
                        severity=RiskLevel.CRITICAL,
                        reason=f"Payload contained raw sensitive credentials ({crit_findings[0].finding_type})",
                        action_enforced="BLOCK"
                    )
                )
                decision = ExecutionDecision.BLOCKED
                risk_delta += 40

        # 2. Evaluate Permission Limit Violations
        if perm_result.limit_exceeded:
            reasons.append(perm_result.reason or "Financial limit exceeded.")
            requires_approval = True
            risk_delta += 35
            violations.append(
                PolicyViolation(
                    policy_name="Financial Limit Enforcement",
                    policy_type=PolicyType.FINANCIAL_LIMIT,
                    severity=RiskLevel.HIGH,
                    reason=f"Attempted ₹{perm_result.requested_amount:,.2f} exceeding maximum limit ₹{perm_result.configured_limit:,.2f}",
                    action_enforced="REQUIRE_APPROVAL"
                )
            )

        if not perm_result.allowed and not perm_result.limit_exceeded:
            reasons.append(perm_result.reason or "Permission denied.")
            decision = ExecutionDecision.BLOCKED
            risk_delta += 45
            violations.append(
                PolicyViolation(
                    policy_name="Least Privilege Access Guard",
                    policy_type=PolicyType.TOOL_RESTRICTION,
                    severity=RiskLevel.HIGH,
                    reason=perm_result.reason or "Tool not assigned to agent.",
                    action_enforced="BLOCK"
                )
            )

        # 3. Evaluate Configured Database Policies
        for pol in policies:
            rule = pol.rule_definition or {}
            
            # Policy Type: FINANCIAL_LIMIT
            if pol.policy_type == PolicyType.FINANCIAL_LIMIT:
                target_action = rule.get("action", "refund_customer")
                if action_name.lower() == target_action.lower() or tool.name.lower() == target_action.lower():
                    field_name = rule.get("field", "amount")
                    val = float(payload.get(field_name, 0.0)) if field_name in payload else 0.0
                    threshold = float(rule.get("value", 10000.0))
                    
                    if val > threshold:
                        requires_approval = True
                        risk_delta += 30
                        reasons.append(f"Policy '{pol.name}': amount (₹{val:,.2f}) exceeds threshold (₹{threshold:,.2f}).")
                        violations.append(
                            PolicyViolation(
                                policy_id=pol.id,
                                policy_name=pol.name,
                                policy_type=pol.policy_type,
                                severity=pol.severity,
                                reason=f"Value ₹{val:,.2f} exceeds rule limit ₹{threshold:,.2f}",
                                action_enforced="REQUIRE_APPROVAL"
                            )
                        )

            # Policy Type: DELETE_OPERATION
            elif pol.policy_type == PolicyType.DELETE_OPERATION:
                target_action = rule.get("action", "customer.delete")
                if action_name.lower() == target_action.lower() or tool.name.lower() == target_action.lower() or "delete" in action_name.lower():
                    decision = ExecutionDecision.BLOCKED
                    risk_delta += 50
                    reasons.append(f"Policy '{pol.name}': Destructive deletion actions are strictly blocked for automated agents.")
                    violations.append(
                        PolicyViolation(
                            policy_id=pol.id,
                            policy_name=pol.name,
                            policy_type=pol.policy_type,
                            severity=pol.severity,
                            reason="Destructive delete operation blocked by security rule.",
                            action_enforced="BLOCK"
                        )
                    )

            # Policy Type: DATA_ACCESS / DATABASE_EXPORT
            elif pol.policy_type in [PolicyType.DATA_ACCESS, PolicyType.TOOL_RESTRICTION]:
                actions = rule.get("actions", ["database.export", "payroll.export"])
                if action_name in actions or tool.name in actions:
                    decision = ExecutionDecision.BLOCKED
                    risk_delta += 50
                    reasons.append(f"Policy '{pol.name}': Unauthorized bulk database export or data extraction blocked.")
                    violations.append(
                        PolicyViolation(
                            policy_id=pol.id,
                            policy_name=pol.name,
                            policy_type=pol.policy_type,
                            severity=pol.severity,
                            reason=f"Action '{action_name}' violates bulk data access governance policy.",
                            action_enforced="BLOCK"
                        )
                    )

            # Policy Type: APPROVAL_REQUIRED
            elif pol.policy_type == PolicyType.APPROVAL_REQUIRED or tool.requires_approval:
                target_actions = rule.get("actions", [])
                if tool.requires_approval or action_name in target_actions:
                    requires_approval = True
                    reasons.append(f"Action '{action_name}' requires human-in-the-loop authorization.")

        # Determine final decision state
        if decision == ExecutionDecision.BLOCKED:
            final_decision = ExecutionDecision.BLOCKED
        elif requires_approval:
            final_decision = ExecutionDecision.PENDING_APPROVAL
        else:
            final_decision = ExecutionDecision.ALLOWED

        return PolicyEvaluationResult(
            decision=final_decision,
            requires_human_approval=requires_approval,
            reasons=reasons if reasons else ["Action satisfies all active security and governance policies."],
            violations=violations,
            risk_score_delta=risk_delta
        )

policy_engine = PolicyEngine()
