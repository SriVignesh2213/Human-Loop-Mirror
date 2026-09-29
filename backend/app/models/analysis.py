from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.db.session import Base
from backend.app.models.base import GUID, generate_uuid, utc_now


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    user_id = Column(GUID, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    status = Column(String(50), default="pending", nullable=False)  # pending, processing, completed, failed
    total_sessions_processed = Column(Integer, default=0, nullable=False)
    total_notifications_processed = Column(Integer, default=0, nullable=False)
    habit_loops_detected = Column(Integer, default=0, nullable=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="analysis_runs")


Index("idx_analysis_user_status", AnalysisRun.user_id, AnalysisRun.status)
