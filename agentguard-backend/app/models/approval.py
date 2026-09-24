from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database.connection import Base
from app.core.permissions import ApprovalStatus

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    execution_id = Column(Integer, ForeignKey("executions.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    requested_by_agent = Column(String(255), nullable=False)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(SQLEnum(ApprovalStatus), default=ApprovalStatus.PENDING, nullable=False, index=True)
    reason = Column(Text, nullable=True)
    decision_notes = Column(Text, nullable=True)
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    decided_at = Column(DateTime, nullable=True)

    # Relationships
    execution = relationship("Execution", back_populates="approval")
    approver = relationship("User", back_populates="approvals")
