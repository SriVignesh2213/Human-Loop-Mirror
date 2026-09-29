from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.db.session import Base
from backend.app.models.base import GUID, generate_uuid, utc_now


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    display_name = Column(String(100), default="Digital Explorer", nullable=False)
    timezone = Column(String(50), default="UTC", nullable=False)
    onboarding_completed = Column(Boolean, default=False, nullable=False)
    preferred_activity_duration = Column(Integer, default=10, nullable=False)  # in minutes
    preferred_activity_types = Column(Text, default="[]", nullable=False)  # JSON-encoded array
    goal_lens = Column(String(100), default="Focus / Study", nullable=False)
    reward_style = Column(String(100), default="mindful", nullable=False)
    energy_preference = Column(String(50), default="moderate", nullable=False)
    social_preference = Column(String(50), default="solo", nullable=False)
    typical_free_time = Column(String(50), default="10-15 minutes", nullable=False)
    high_risk_periods = Column(Text, default="[\"evening\"]", nullable=False)  # JSON-encoded array
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="profile")


class UserInterest(Base):
    __tablename__ = "user_interests"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    category = Column(String(100), index=True, nullable=False)
    priority = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="interests")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    preference_key = Column(String(100), index=True, nullable=False)
    preference_value = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="preferences")


class UserActivityPreference(Base):
    __tablename__ = "user_activity_preferences"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    activity_category = Column(String(100), index=True, nullable=False)
    preference_type = Column(String(50), nullable=False)  # "preferred" or "avoid"
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="activity_preferences")
