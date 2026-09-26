from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.connection import get_db
from app.models.agent import Agent
from app.models.execution import Execution
from app.models.approval import Approval
from app.models.incident import Incident
from app.models.policy import Policy
from app.models.tool import Tool
from app.models.user import User
from app.core.permissions import ExecutionDecision, ApprovalStatus, IncidentStatus, AgentStatus, RiskLevel
from app.schemas.incident import (
    DashboardStatsResponse,
    SecurityTrendPoint,
    RiskDistributionResponse,
    RiskyAgentLeaderboardItem,
    HeatmapCell
)
from app.schemas.common import ApiResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])

@router.get("/stats", response_model=ApiResponse[DashboardStatsResponse])
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.utcnow()
    start_of_today = datetime(now.year, now.month, now.day)

    active_agents = db.query(Agent).filter(Agent.status == AgentStatus.ACTIVE).count()
    total_agents = db.query(Agent).count()
    active_policies = db.query(Policy).filter(Policy.enabled == True).count()
    active_tools = db.query(Tool).filter(Tool.enabled == True).count()

    actions_today = db.query(Execution).filter(Execution.created_at >= start_of_today).count()
    blocked_today = db.query(Execution).filter(
        Execution.created_at >= start_of_today,
        Execution.decision == ExecutionDecision.BLOCKED
    ).count()

    pending_approvals = db.query(Approval).filter(Approval.status == ApprovalStatus.PENDING).count()
    open_incidents = db.query(Incident).filter(Incident.status != IncidentStatus.RESOLVED).count()

    # Calculate risk distribution
    low_cnt = db.query(Execution).filter(Execution.risk_level == RiskLevel.LOW).count()
    med_cnt = db.query(Execution).filter(Execution.risk_level == RiskLevel.MEDIUM).count()
    high_cnt = db.query(Execution).filter(Execution.risk_level == RiskLevel.HIGH).count()
    crit_cnt = db.query(Execution).filter(Execution.risk_level == RiskLevel.CRITICAL).count()
    risk_dist = RiskDistributionResponse(
        low=low_cnt,
        medium=med_cnt,
        high=high_cnt,
        critical=crit_cnt,
        total=low_cnt + med_cnt + high_cnt + crit_cnt
    )

    # Calculate system security health score (0-100)
    total_actions = db.query(Execution).count()
    blocked_actions = db.query(Execution).filter(Execution.decision == ExecutionDecision.BLOCKED).count()
    
    # Baseline 98, subtract based on open critical incidents and high blocked ratios
    score = 98 - (open_incidents * 3) - (pending_approvals * 1)
    if total_actions > 0 and (blocked_actions / total_actions) > 0.2:
        score -= 5
    security_score = max(50, min(100, score))

    system_status = "SYSTEM SECURE"
    if open_incidents > 3 or security_score < 75:
        system_status = "ATTENTION REQUIRED"
    if any(i.severity == "CRITICAL" for i in db.query(Incident).filter(Incident.status == IncidentStatus.OPEN).all()):
        system_status = "CRITICAL EVENT"

    return ApiResponse(
        success=True,
        data=DashboardStatsResponse(
            active_agents=active_agents,
            total_agents=total_agents,
            active_policies=active_policies,
            active_tools=active_tools,
            actions_today=actions_today,
            executions_today=actions_today,
            blocked_today=blocked_today,
            pending_approvals=pending_approvals,
            open_incidents=open_incidents,
            security_score=security_score,
            system_status=system_status,
            risk_distribution=risk_dist,
            timestamp=now
        )
    )

@router.get("/security-trends", response_model=ApiResponse[List[SecurityTrendPoint]])
def get_security_trends(
    range_view: str = Query("24H", regex="^(24H|7D|30D)$"),
    range_filter: Optional[str] = Query(None, alias="range", regex="^(24H|7D|30D)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    selected_range = range_filter or range_view
    now = datetime.utcnow()
    points: List[SecurityTrendPoint] = []

    if selected_range == "24H":
        # Hourly breakdown for last 12 intervals
        for i in range(11, -1, -1):
            interval_time = now - timedelta(hours=i * 2)
            label = interval_time.strftime("%H:00")
            
            # Count records around this interval
            start_t = interval_time - timedelta(hours=1)
            end_t = interval_time + timedelta(hours=1)
            
            allowed = db.query(Execution).filter(Execution.decision == ExecutionDecision.ALLOWED, Execution.created_at.between(start_t, end_t)).count()
            blocked = db.query(Execution).filter(Execution.decision == ExecutionDecision.BLOCKED, Execution.created_at.between(start_t, end_t)).count()
            pending = db.query(Execution).filter(Execution.decision == ExecutionDecision.PENDING_APPROVAL, Execution.created_at.between(start_t, end_t)).count()
            
            points.append(SecurityTrendPoint(timestamp=label, allowed=allowed, blocked=blocked, pending=pending))

    elif selected_range == "7D":
        for i in range(6, -1, -1):
            day_time = now - timedelta(days=i)
            label = day_time.strftime("%a")
            start_t = datetime(day_time.year, day_time.month, day_time.day)
            end_t = start_t + timedelta(days=1)
            
            allowed = db.query(Execution).filter(Execution.decision == ExecutionDecision.ALLOWED, Execution.created_at.between(start_t, end_t)).count()
            blocked = db.query(Execution).filter(Execution.decision == ExecutionDecision.BLOCKED, Execution.created_at.between(start_t, end_t)).count()
            pending = db.query(Execution).filter(Execution.decision == ExecutionDecision.PENDING_APPROVAL, Execution.created_at.between(start_t, end_t)).count()
            
            points.append(SecurityTrendPoint(timestamp=label, allowed=allowed, blocked=blocked, pending=pending))

    else:  # 30D
        for i in range(29, -1, -3):
            day_time = now - timedelta(days=i)
            label = day_time.strftime("%b %d")
            start_t = datetime(day_time.year, day_time.month, day_time.day)
            end_t = start_t + timedelta(days=3)
            
            allowed = db.query(Execution).filter(Execution.decision == ExecutionDecision.ALLOWED, Execution.created_at.between(start_t, end_t)).count()
            blocked = db.query(Execution).filter(Execution.decision == ExecutionDecision.BLOCKED, Execution.created_at.between(start_t, end_t)).count()
            pending = db.query(Execution).filter(Execution.decision == ExecutionDecision.PENDING_APPROVAL, Execution.created_at.between(start_t, end_t)).count()
            
            points.append(SecurityTrendPoint(timestamp=label, allowed=allowed, blocked=blocked, pending=pending))

    return ApiResponse(success=True, data=points)

@router.get("/risk-distribution", response_model=ApiResponse[RiskDistributionResponse])
def get_risk_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    low_cnt = db.query(Execution).filter(Execution.risk_level == RiskLevel.LOW).count()
    med_cnt = db.query(Execution).filter(Execution.risk_level == RiskLevel.MEDIUM).count()
    high_cnt = db.query(Execution).filter(Execution.risk_level == RiskLevel.HIGH).count()
    crit_cnt = db.query(Execution).filter(Execution.risk_level == RiskLevel.CRITICAL).count()
    total = low_cnt + med_cnt + high_cnt + crit_cnt

    return ApiResponse(
        success=True,
        data=RiskDistributionResponse(
            low=low_cnt,
            medium=med_cnt,
            high=high_cnt,
            critical=crit_cnt,
            total=total
        )
    )

@router.get("/top-risky-agents", response_model=ApiResponse[List[RiskyAgentLeaderboardItem]])
def get_top_risky_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agents = db.query(Agent).all()
    results = []
    
    for a in agents:
        blocked_cnt = db.query(Execution).filter(
            Execution.agent_id == a.id,
            Execution.decision == ExecutionDecision.BLOCKED
        ).count()

        last_exec = db.query(Execution).filter(Execution.agent_id == a.id).order_by(Execution.created_at.desc()).first()

        results.append(
            RiskyAgentLeaderboardItem(
                agent_id=a.id,
                agent_name=a.name,
                provider=a.provider,
                environment=a.environment,
                risk_level=a.risk_level.value,
                blocked_actions=blocked_cnt,
                policy_violations=blocked_cnt,
                security_score=a.security_score,
                status=a.status.value,
                last_activity=last_exec.created_at if last_exec else a.created_at
            )
        )
    
    # Sort with highest risk and blocked actions at top
    results.sort(key=lambda x: (x.blocked_actions, 100 - x.security_score), reverse=True)
    return ApiResponse(success=True, data=results)

@router.get("/risk-heatmap", response_model=ApiResponse[List[HeatmapCell]])
def get_risk_heatmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    agents = db.query(Agent).all()
    hours = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"]
    cells: List[HeatmapCell] = []

    for a in agents:
        for idx, h in enumerate(hours):
            # Deterministic distribution for demonstration
            base_risk = 15 if a.risk_level == RiskLevel.LOW else (65 if a.risk_level == RiskLevel.HIGH else 35)
            # Add variation
            mod = ((idx + a.id) * 11) % 40
            score = min(100, max(5, base_risk + mod - 15))
            cells.append(
                HeatmapCell(
                    agent_name=a.name,
                    hour=h,
                    risk_score=score,
                    event_count=max(1, int(score / 15))
                )
            )

    return ApiResponse(success=True, data=cells)
