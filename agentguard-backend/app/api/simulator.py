from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.agent import Agent
from app.models.security_test import SecurityTest
from app.models.user import User
from app.schemas.security_test import (
    SecurityTestRunRequest,
    SecurityTestReportResponse,
    SecurityTestHistoryItem
)
from app.schemas.common import ApiResponse
from app.api.deps import get_current_user, require_analyst_or_above
from app.services.simulator_service import simulator_service

router = APIRouter(prefix="/security-tests", tags=["Security Test Lab"])

@router.get("/scenarios", response_model=ApiResponse[List[dict]])
def list_available_scenarios(current_user: User = Depends(get_current_user)):
    """
    Returns list of 10 pre-configured harmless security test scenarios.
    """
    return ApiResponse(
        success=True,
        data=simulator_service.SCENARIOS
    )

@router.post("/run", response_model=ApiResponse[SecurityTestReportResponse])
def run_security_test(
    payload: SecurityTestRunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_analyst_or_above)
):
    agent = db.query(Agent).filter(Agent.id == payload.agent_id).first()
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found.")

    report = simulator_service.run_tests_for_agent(
        db=db,
        agent=agent,
        scenario_ids=payload.scenario_ids,
        user_id=current_user.id
    )

    return ApiResponse(
        success=True,
        message=f"Security Test Run completed: {report.passed_tests} Passed, {report.failed_tests} Failed.",
        data=report
    )

@router.get("", response_model=ApiResponse[List[SecurityTestHistoryItem]])
def list_security_test_history(
    agent_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(SecurityTest).order_by(SecurityTest.executed_at.desc())
    if agent_id:
        query = query.filter(SecurityTest.agent_id == agent_id)

    tests = query.limit(limit).all()
    results = []
    for t in tests:
        results.append(
            SecurityTestHistoryItem(
                id=t.id,
                agent_id=t.agent_id,
                agent_name=t.agent.name if t.agent else "Unknown Agent",
                scenario_name=t.scenario_name,
                category=t.category,
                input_data=t.input_data,
                expected_result=t.expected_result,
                actual_result=t.actual_result,
                passed=t.passed,
                risk_level=t.risk_level,
                remediation=t.remediation,
                executed_at=t.executed_at
            )
        )
    return ApiResponse(success=True, data=results)
