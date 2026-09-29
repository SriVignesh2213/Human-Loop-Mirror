from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.db.session import Base
from backend.app.models.base import GUID, generate_uuid, utc_now


class PersonalSwapSuggestion(Base):
    __tablename__ = "personal_swap_suggestions"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    habit_loop_id = Column(GUID, ForeignKey("habit_loops.id", ondelete="SET NULL"), nullable=True)
    activity_id = Column(GUID, ForeignKey("activities.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    difficulty = Column(String(50), default="easy", nullable=False)
    reason = Column(Text, nullable=False)
    user_fit = Column(String(50), default="high", nullable=False)
    reward_type = Column(String(50), default="creative", nullable=False)
    status = Column(String(50), default="suggested", nullable=False)  # suggested, chosen, started, completed, skipped
    created_at = Column(DateTime, default=utc_now, index=True, nullable=False)

    user = relationship("User", back_populates="swap_suggestions")
    habit_loop = relationship("HabitLoop", back_populates="swap_suggestions")
    activity = relationship("Activity")
    completions = relationship("PersonalSwapCompletion", back_populates="suggestion", cascade="all, delete-orphan")


class PersonalSwapCompletion(Base):
    __tablename__ = "personal_swap_completions"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    suggestion_id = Column(GUID, ForeignKey("personal_swap_suggestions.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    completed_at = Column(DateTime, default=utc_now, nullable=False)
    feedback_rating = Column(Integer, nullable=True)  # 1 to 5
    reflection_notes = Column(Text, nullable=True)

    suggestion = relationship("PersonalSwapSuggestion", back_populates="completions")


Index("idx_swap_user_status", PersonalSwapSuggestion.user_id, PersonalSwapSuggestion.status)
