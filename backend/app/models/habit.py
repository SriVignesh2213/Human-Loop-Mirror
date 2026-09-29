from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.db.session import Base
from backend.app.models.base import GUID, generate_uuid, utc_now


class HabitLoop(Base):
    __tablename__ = "habit_loops"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    app_id = Column(GUID, ForeignKey("applications.id", ondelete="SET NULL"), nullable=True)
    app_name = Column(String(100), index=True, nullable=False)
    trigger_description = Column(String(255), nullable=False)
    action_description = Column(String(255), nullable=False)
    time_window_start = Column(String(10), nullable=False)  # e.g., "20:00"
    time_window_end = Column(String(10), nullable=False)    # e.g., "22:00"
    occurrences_count = Column(Integer, default=0, nullable=False)
    total_days_analyzed = Column(Integer, default=7, nullable=False)
    average_duration_minutes = Column(Float, default=0.0, nullable=False)
    total_minutes_impact = Column(Float, default=0.0, nullable=False)
    confidence = Column(String(20), default="high", nullable=False)  # low, medium, high
    status = Column(String(20), default="active", nullable=False)    # active, interrupted, improved
    recommendation = Column(String(500), default="", nullable=False)
    last_detected_at = Column(DateTime, default=utc_now, nullable=False)
    created_at = Column(DateTime, default=utc_now, index=True, nullable=False)

    user = relationship("User", back_populates="habit_loops")
    evidence_items = relationship("HabitLoopEvidence", back_populates="habit_loop", cascade="all, delete-orphan")
    insights = relationship("Insight", back_populates="habit_loop")
    swap_suggestions = relationship("PersonalSwapSuggestion", back_populates="habit_loop")


class HabitLoopEvidence(Base):
    __tablename__ = "habit_loop_evidence"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    habit_loop_id = Column(GUID, ForeignKey("habit_loops.id", ondelete="CASCADE"), index=True, nullable=False)
    session_id = Column(GUID, ForeignKey("usage_sessions.id", ondelete="SET NULL"), nullable=True)
    session_timestamp = Column(DateTime, nullable=False)
    session_duration_minutes = Column(Float, nullable=False)
    notification_timestamp = Column(DateTime, nullable=True)
    notification_title = Column(String(255), nullable=True)
    latency_minutes = Column(Float, nullable=True)  # latency between notification and session start

    habit_loop = relationship("HabitLoop", back_populates="evidence_items")


Index("idx_habit_user_app", HabitLoop.user_id, HabitLoop.app_name)
Index("idx_evidence_loop_id", HabitLoopEvidence.habit_loop_id)
