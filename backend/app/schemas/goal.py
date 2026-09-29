from typing import Optional, List
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class GoalCreate(BaseModel):
    goal_lens: str = "Reduce Digital Distraction"
    title: str = Field(..., min_length=2, max_length=200)
    target_metric: str = "daily_screen_time_minutes"
    target_value: float = Field(..., gt=0)
    unit: str = "minutes/day"
    explanation: Optional[str] = ""


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target_value: Optional[float] = None
    status: Optional[str] = None  # active, paused, completed
    explanation: Optional[str] = None


class GoalProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    date: str
    achieved: bool
    metric_value: float


class GoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    goal_lens: str
    title: str
    target_metric: str
    target_value: float
    current_value: float
    unit: str
    status: str
    explanation: str
    created_at: datetime
    updated_at: datetime
    progress_records: Optional[List[GoalProgressResponse]] = None
