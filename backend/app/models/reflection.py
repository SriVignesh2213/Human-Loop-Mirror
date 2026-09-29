from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.db.session import Base
from backend.app.models.base import GUID, generate_uuid, utc_now


class Reflection(Base):
    __tablename__ = "reflections"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    session_id = Column(GUID, ForeignKey("usage_sessions.id", ondelete="SET NULL"), nullable=True)
    intentionality_label = Column(String(50), nullable=False)  # "Planned", "Necessary", "Relaxation", "Unplanned"
    notes = Column(Text, nullable=True)
    prompt_answered = Column(String(255), default="Was this session intentional?", nullable=False)
    created_at = Column(DateTime, default=utc_now, index=True, nullable=False)

    user = relationship("User", back_populates="reflections")
    session = relationship("UsageSession", back_populates="reflections")


Index("idx_reflection_user_created", Reflection.user_id, Reflection.created_at)
