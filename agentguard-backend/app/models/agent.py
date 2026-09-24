from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database.connection import Base
from app.core.permissions import AgentStatus, RiskLevel

class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    provider = Column(String(100), default="OpenAI", nullable=False)
    environment = Column(String(50), default="Production", nullable=False)
    status = Column(SQLEnum(AgentStatus), default=AgentStatus.ACTIVE, nullable=False)
    risk_level = Column(SQLEnum(RiskLevel), default=RiskLevel.LOW, nullable=False)
    security_score = Column(Integer, default=95, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    owner = relationship("User", back_populates="owned_agents")
    tools = relationship("AgentTool", back_populates="agent", cascade="all, delete-orphan")
    permissions = relationship("AgentPermission", back_populates="agent", cascade="all, delete-orphan")
    executions = relationship("Execution", back_populates="agent", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="agent", cascade="all, delete-orphan")
    security_tests = relationship("SecurityTest", back_populates="agent", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="agent")
