from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON
from app.database.connection import Base
from app.core.permissions import PolicyType, RiskLevel

class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    policy_type = Column(SQLEnum(PolicyType), nullable=False, index=True)
    rule_definition = Column(JSON, nullable=False)  # JSON structure defining condition, threshold, and action
    severity = Column(SQLEnum(RiskLevel), default=RiskLevel.HIGH, nullable=False)
    enabled = Column(Boolean, default=True, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
