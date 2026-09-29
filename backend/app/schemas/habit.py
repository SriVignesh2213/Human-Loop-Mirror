from typing import List, Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class HabitLoopEvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    session_id: Optional[UUID] = None
    session_timestamp: datetime
    session_duration_minutes: float
    notification_timestamp: Optional[datetime] = None
    notification_title: Optional[str] = None
    latency_minutes: Optional[float] = None


class HabitLoopResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    app_name: str
    trigger_description: str
    action_description: str
    time_window_start: str
    time_window_end: str
    occurrences_count: int
    total_days_analyzed: int
    average_duration_minutes: float
    total_minutes_impact: float
    confidence: str
    status: str
    recommendation: str
    last_detected_at: datetime
    created_at: datetime
    evidence_items: Optional[List[HabitLoopEvidenceResponse]] = None
