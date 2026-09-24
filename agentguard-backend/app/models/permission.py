from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from app.database.connection import Base
from app.core.permissions import PermissionType

class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(SQLEnum(PermissionType), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)

    agent_permissions = relationship("AgentPermission", back_populates="permission", cascade="all, delete-orphan")

class AgentPermission(Base):
    __tablename__ = "agent_permissions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    permission_id = Column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False, index=True)
    max_amount = Column(Float, nullable=True)  # For FINANCIAL permission (e.g. 10000.0)
    restrictions = Column(JSON, nullable=True)  # JSON-encoded restrictions (allowed scopes, datasets, etc.)
    enabled = Column(Boolean, default=True, nullable=False)

    # Relationships
    agent = relationship("Agent", back_populates="permissions")
    permission = relationship("Permission", back_populates="agent_permissions")
