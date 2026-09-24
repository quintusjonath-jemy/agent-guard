from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from app.database.connection import Base
from app.core.permissions import RiskLevel, ExecutionDecision

class Execution(Base):
    __tablename__ = "executions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    tool_id = Column(Integer, ForeignKey("tools.id", ondelete="SET NULL"), nullable=True, index=True)
    action_name = Column(String(150), nullable=False, index=True)
    request_payload = Column(JSON, nullable=True)
    sanitized_payload = Column(JSON, nullable=True)
    decision = Column(SQLEnum(ExecutionDecision), nullable=False, index=True)
    risk_score = Column(Integer, default=0, nullable=False)
    risk_level = Column(SQLEnum(RiskLevel), default=RiskLevel.LOW, nullable=False)
    reason = Column(Text, nullable=True)
    pipeline_breakdown = Column(JSON, nullable=True)  # Store step-by-step checklist (Auth, Perms, Policy, DLP, etc.)
    execution_status = Column(String(50), default="COMPLETED", nullable=False)
    response_payload = Column(JSON, nullable=True)
    duration_ms = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    agent = relationship("Agent", back_populates="executions")
    tool = relationship("Tool", back_populates="executions")
    approval = relationship("Approval", back_populates="execution", uselist=False, cascade="all, delete-orphan")
    incident = relationship("Incident", back_populates="execution", uselist=False)
