from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.db.session import Base
from backend.app.models.base import GUID, generate_uuid, utc_now


class Application(Base):
    __tablename__ = "applications"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, index=True, nullable=False)
    category = Column(String(100), default="Productivity", nullable=False)
    icon_name = Column(String(50), default="app", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    app_id = Column(GUID, ForeignKey("applications.id", ondelete="SET NULL"), nullable=True)
    app_name = Column(String(100), index=True, nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)
    title = Column(String(255), default="", nullable=False)
    content_preview = Column(String(255), default="", nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User", back_populates="notifications")
    sessions = relationship("UsageSession", back_populates="associated_notification")


class UsageSession(Base):
    __tablename__ = "usage_sessions"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    app_id = Column(GUID, ForeignKey("applications.id", ondelete="SET NULL"), nullable=True)
    app_name = Column(String(100), index=True, nullable=False)
    start_time = Column(DateTime, index=True, nullable=False)
    end_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Float, nullable=False)
    is_long_session = Column(Boolean, default=False, nullable=False)  # 30+ mins
    notification_associated = Column(Boolean, default=False, nullable=False)
    notification_id = Column(GUID, ForeignKey("notifications.id", ondelete="SET NULL"), nullable=True)
    reflection_label = Column(String(50), nullable=True)  # Planned, Necessary, Relaxation, Unplanned
    created_at = Column(DateTime, default=utc_now, index=True, nullable=False)

    user = relationship("User", back_populates="usage_sessions")
    associated_notification = relationship("Notification", back_populates="sessions")
    reflections = relationship("Reflection", back_populates="session")


Index("idx_usage_user_start", UsageSession.user_id, UsageSession.start_time)
Index("idx_notification_user_time", Notification.user_id, Notification.timestamp)
