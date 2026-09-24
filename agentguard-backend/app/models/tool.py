from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database.connection import Base
from app.core.permissions import RiskLevel, PermissionType

class Tool(Base):
    __tablename__ = "tools"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    tool_type = Column(String(100), default="API", nullable=False)
    endpoint = Column(String(255), nullable=True)
    risk_level = Column(SQLEnum(RiskLevel), default=RiskLevel.LOW, nullable=False)
    required_permission = Column(SQLEnum(PermissionType), default=PermissionType.READ, nullable=False)
    requires_approval = Column(Boolean, default=False, nullable=False)
    enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    agent_links = relationship("AgentTool", back_populates="tool", cascade="all, delete-orphan")
    executions = relationship("Execution", back_populates="tool")
