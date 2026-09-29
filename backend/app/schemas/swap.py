from typing import Optional, List
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class PersonalSwapSuggestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    habit_loop_id: Optional[UUID] = None
    activity_id: Optional[UUID] = None
    title: str
    category: str
    duration_minutes: int
    difficulty: str
    reason: str
    user_fit: str
    reward_type: str
    status: str
    created_at: datetime


class PersonalSwapActionRequest(BaseModel):
    rating: Optional[int] = None
    notes: Optional[str] = None


class PersonalSwapGenerateRequest(BaseModel):
    habit_loop_id: Optional[UUID] = None
    available_minutes: Optional[int] = None
    force_refresh: bool = False
