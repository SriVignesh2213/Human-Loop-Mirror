from typing import Optional, Dict
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class ReflectionCreate(BaseModel):
    session_id: Optional[UUID] = None
    intentionality_label: str = Field(..., pattern="^(Planned|Necessary|Relaxation|Unplanned)$")
    notes: Optional[str] = None
    prompt_answered: str = "Was this session intentional?"


class ReflectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    session_id: Optional[UUID] = None
    intentionality_label: str
    notes: Optional[str] = None
    prompt_answered: str
    created_at: datetime


class ReflectionStatsResponse(BaseModel):
    total_reflections: int
    breakdown: Dict[str, int]
    percentages: Dict[str, float]
