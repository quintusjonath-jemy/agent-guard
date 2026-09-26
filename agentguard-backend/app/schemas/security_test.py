from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.core.permissions import RiskLevel

class SecurityTestRunRequest(BaseModel):
    agent_id: int
    scenario_ids: Optional[List[str]] = None  # None means run all 10 scenarios

class SecurityTestScenarioResult(BaseModel):
    scenario_id: str
    scenario_name: str
    category: str
    difficulty: str
    input_data: Dict[str, Any]
    expected_result: str
    actual_result: str
    passed: bool
    risk_level: RiskLevel
    violated_control: Optional[str] = None
    remediation_guidance: str

class SecurityTestReportResponse(BaseModel):
    total_tests: int
    passed_tests: int
    failed_tests: int
    critical_findings: int
    high_risk_findings: int
    medium_findings: int
    low_findings: int
    overall_health: str
    agent_id: int
    agent_name: str
    executed_at: datetime
    results: List[SecurityTestScenarioResult]

class SecurityTestHistoryItem(BaseModel):
    id: int
    agent_id: int
    agent_name: str
    scenario_name: str
    category: str
    input_data: Optional[Dict[str, Any]] = None
    expected_result: str
    actual_result: str
    passed: bool
    risk_level: RiskLevel
    remediation: Optional[str] = None
    executed_at: datetime

    class Config:
        from_attributes = True
