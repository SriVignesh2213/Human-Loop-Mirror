from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from backend.app.db.session import Base
from backend.app.models.base import GUID, generate_uuid, utc_now


class User(Base):
    __tablename__ = "users"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    interests = relationship("UserInterest", back_populates="user", cascade="all, delete-orphan")
    preferences = relationship("UserPreference", back_populates="user", cascade="all, delete-orphan")
    activity_preferences = relationship("UserActivityPreference", back_populates="user", cascade="all, delete-orphan")
    usage_sessions = relationship("UsageSession", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    habit_loops = relationship("HabitLoop", back_populates="user", cascade="all, delete-orphan")
    insights = relationship("Insight", back_populates="user", cascade="all, delete-orphan")
    reflections = relationship("Reflection", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    swap_suggestions = relationship("PersonalSwapSuggestion", back_populates="user", cascade="all, delete-orphan")
    analysis_runs = relationship("AnalysisRun", back_populates="user", cascade="all, delete-orphan")
