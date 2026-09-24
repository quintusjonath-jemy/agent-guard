from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

class AgentTool(Base):
    __tablename__ = "agent_tools"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    agent_id = Column(Integer, ForeignKey("agents.id", ondelete="CASCADE"), nullable=False, index=True)
    tool_id = Column(Integer, ForeignKey("tools.id", ondelete="CASCADE"), nullable=False, index=True)
    permission_level = Column(String(50), default="STANDARD", nullable=False)
    enabled = Column(Boolean, default=True, nullable=False)

    # Relationships
    agent = relationship("Agent", back_populates="tools")
    tool = relationship("Tool", back_populates="agent_links")
