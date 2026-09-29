from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.db.session import Base
from backend.app.models.base import GUID, generate_uuid, utc_now


class Insight(Base):
    __tablename__ = "insights"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    habit_loop_id = Column(GUID, ForeignKey("habit_loops.id", ondelete="SET NULL"), nullable=True)
    insight_type = Column(String(50), default="biggest_insight", nullable=False)  # biggest_insight, habit_loop, trend, reflection
    title = Column(String(255), nullable=False)
    observation = Column(Text, nullable=False)
    evidence = Column(Text, default="[]", nullable=False)  # JSON-encoded array of evidence strings
    why_it_matters = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=False)
    confidence = Column(String(20), default="high", nullable=False)
    source = Column(String(50), default="kimi", nullable=False)  # "kimi" or "deterministic_fallback"
    created_at = Column(DateTime, default=utc_now, index=True, nullable=False)

    user = relationship("User", back_populates="insights")
    habit_loop = relationship("HabitLoop", back_populates="insights")


Index("idx_insights_user_created", Insight.user_id, Insight.created_at)
