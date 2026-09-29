from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime
from backend.app.db.session import Base
from backend.app.models.base import GUID, generate_uuid, utc_now


class Activity(Base):
    __tablename__ = "activities"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    category = Column(String(100), index=True, nullable=False)
    duration_minutes = Column(Integer, index=True, nullable=False)
    difficulty = Column(String(50), default="easy", nullable=False)  # easy, medium, hard
    social_type = Column(String(50), default="solo", nullable=False)  # solo, social, both
    energy_level = Column(String(50), default="low", nullable=False)  # low, medium, high
    reward_type = Column(String(50), default="relaxing", nullable=False)  # creative, intellectual, physical, relaxing, mindful
    required_resources = Column(String(255), default="none", nullable=False)
    instructions = Column(Text, default="", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
