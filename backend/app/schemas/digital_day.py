from typing import List, Optional, Dict
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class DigitalDayEvent(BaseModel):
    id: UUID
    event_type: str  # "session", "notification", "habit_loop", "reflection"
    timestamp: datetime
    end_time: Optional[datetime] = None
    app_name: str
    duration_minutes: Optional[float] = None
    is_long_session: bool = False
    notification_associated: bool = False
    notification_title: Optional[str] = None
    reflection_label: Optional[str] = None
    details: Optional[str] = None


class DigitalDayResponse(BaseModel):
    date: str
    view_type: str  # "day" or "week"
    events: List[DigitalDayEvent]
    total_screen_time_minutes: float
    total_sessions: int
    notification_triggered_count: int
    long_sessions_count: int
    late_night_count: int
    top_apps: Dict[str, float]
