from typing import Dict, Any, List
from pydantic import BaseModel
from app.models.agent import Agent
from app.models.tool import Tool
from app.core.permissions import RiskLevel, PermissionType
from app.services.permission_service import PermissionCheckResult
from app.services.sensitive_data_service import DLPScanResult
from app.services.policy_engine import PolicyEvaluationResult

class RiskFactor(BaseModel):
    category: str
    points: int
    description: str

class RiskCalculationResult(BaseModel):
    score: int
    level: RiskLevel
    factors: List[RiskFactor]

class RiskEngine:
    TOOL_BASE_RISK = {
        PermissionType.READ: 10,
        PermissionType.WRITE: 25,
        PermissionType.EXTERNAL_COMMUNICATION: 35,
        PermissionType.FINANCIAL: 55,
        PermissionType.SENSITIVE_DATA: 60,
        PermissionType.FILE_MODIFICATION: 65,
        PermissionType.DELETE: 80,
        PermissionType.DATABASE_EXPORT: 85,
    }

    def calculate_risk(
        self,
        agent: Agent,
        tool: Tool,
        action_name: str,
        payload: Dict[str, Any],
        perm_result: PermissionCheckResult,
        dlp_result: DLPScanResult,
        policy_result: PolicyEvaluationResult
    ) -> RiskCalculationResult:
        factors: List[RiskFactor] = []
        raw_score = 0

        # 1. Base Tool Risk
        base_points = self.TOOL_BASE_RISK.get(tool.required_permission, 20)
        raw_score += base_points
        factors.append(
            RiskFactor(
                category="TOOL_SENSITIVITY",
                points=base_points,
                description=f"Base risk for '{tool.name}' ({tool.required_permission.value})"
            )
        )

        # 2. Permission Evaluation Factor
        if not perm_result.allowed and not perm_result.limit_exceeded:
            raw_score += 35
            factors.append(
                RiskFactor(
                    category="UNAUTHORIZED_ACCESS_ATTEMPT",
                    points=35,
                    description=f"Agent attempted tool without assigned permissions"
                )
            )

        # 3. Financial Magnitude
        if perm_result.limit_exceeded:
            raw_score += 30
            factors.append(
                RiskFactor(
                    category="FINANCIAL_THRESHOLD_EXCEEDED",
                    points=30,
                    description=f"Requested amount ₹{perm_result.requested_amount:,.2f} exceeds agent limit"
                )
            )

        # 4. DLP Sensitive Data Finding
        if dlp_result.has_sensitive_data:
            crit_count = sum(1 for f in dlp_result.findings if f.severity in [RiskLevel.HIGH, RiskLevel.CRITICAL])
            if crit_count > 0:
                raw_score += 40
                factors.append(
                    RiskFactor(
                        category="SENSITIVE_CREDENTIAL_LEAK",
                        points=40,
                        description=f"Exposed high-entropy secret, API key or PCI data in payload"
                    )
                )
            else:
                raw_score += 15
                factors.append(
                    RiskFactor(
                        category="PII_DATA_DETECTED",
                        points=15,
                        description="Personal identifiable information (PII) identified in payload"
                    )
                )

        # 5. Policy Violations
        if policy_result.violations:
            for v in policy_result.violations:
                v_points = 35 if v.severity == RiskLevel.CRITICAL else (25 if v.severity == RiskLevel.HIGH else 15)
                raw_score += v_points
                factors.append(
                    RiskFactor(
                        category="POLICY_VIOLATION",
                        points=v_points,
                        description=f"Violated policy '{v.policy_name}' ({v.action_enforced})"
                    )
                )

        # Normalize score between 0 and 100
        final_score = min(100, max(0, raw_score))

        # Categorize Risk Level
        if final_score >= 80:
            level = RiskLevel.CRITICAL
        elif final_score >= 60:
            level = RiskLevel.HIGH
        elif final_score >= 30:
            level = RiskLevel.MEDIUM
        else:
            level = RiskLevel.LOW

        return RiskCalculationResult(
            score=final_score,
            level=level,
            factors=factors
        )

risk_engine = RiskEngine()
