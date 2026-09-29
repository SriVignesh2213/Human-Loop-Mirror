from sqlalchemy import Column, String, Float, Boolean, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.db.session import Base
from backend.app.models.base import GUID, generate_uuid, utc_now


class Goal(Base):
    __tablename__ = "goals"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    goal_lens = Column(String(100), default="Reduce Digital Distraction", nullable=False)  # Focus / Study, Sleep, Be Present, Reduce Digital Distraction, Build Better Routines, Custom
    title = Column(String(200), nullable=False)
    target_metric = Column(String(100), default="daily_screen_time_minutes", nullable=False)
    target_value = Column(Float, nullable=False)
    current_value = Column(Float, default=0.0, nullable=False)
    unit = Column(String(50), default="minutes/day", nullable=False)
    status = Column(String(20), default="active", nullable=False)  # active, paused, completed
    explanation = Column(Text, default="", nullable=False)
    created_at = Column(DateTime, default=utc_now, index=True, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="goals")
    progress_records = relationship("GoalProgress", back_populates="goal", cascade="all, delete-orphan")


class GoalProgress(Base):
    __tablename__ = "goal_progress"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    goal_id = Column(GUID, ForeignKey("goals.id", ondelete="CASCADE"), index=True, nullable=False)
    date = Column(String(10), index=True, nullable=False)  # YYYY-MM-DD
    achieved = Column(Boolean, default=False, nullable=False)
    metric_value = Column(Float, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    goal = relationship("Goal", back_populates="progress_records")


Index("idx_goals_user_status", Goal.user_id, Goal.status)
Index("idx_goal_progress_date", GoalProgress.goal_id, GoalProgress.date)
