from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from app.database.connection import Base
from app.core.permissions import RiskLevel

class SecurityTest(Base):
    __tablename__ = "security_tests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    scenario_name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    input_data = Column(JSON, nullable=False)
    expected_result = Column(String(50), nullable=False)
    actual_result = Column(String(50), nullable=False)
    passed = Column(Boolean, nullable=False)
    risk_level = Column(SQLEnum(RiskLevel), default=RiskLevel.MEDIUM, nullable=False)
    remediation = Column(Text, nullable=True)
    executed_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    agent = relationship("Agent", back_populates="security_tests")
