from typing import List, Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class UserProfileBase(BaseModel):
    display_name: str = "Digital Explorer"
    timezone: str = "UTC"
    preferred_activity_duration: int = 10
    preferred_activity_types: List[str] = Field(default_factory=list)
    goal_lens: str = "Focus / Study"
    reward_style: str = "mindful"
    energy_preference: str = "moderate"
    social_preference: str = "solo"
    typical_free_time: str = "10-15 minutes"
    high_risk_periods: List[str] = Field(default_factory=lambda: ["evening"])


class UserProfileResponse(UserProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    onboarding_completed: bool
    created_at: datetime
    updated_at: datetime


class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    email: Optional[str] = None
    timezone: Optional[str] = None
    preferred_activity_duration: Optional[int] = None
    preferred_activity_types: Optional[List[str]] = None
    goal_lens: Optional[str] = None
    reward_style: Optional[str] = None
    energy_preference: Optional[str] = None
    social_preference: Optional[str] = None
    typical_free_time: Optional[str] = None
    high_risk_periods: Optional[List[str]] = None



class OnboardingRequest(BaseModel):
    display_name: Optional[str] = "Digital Explorer"
    favorite_activities: List[str] = Field(default_factory=list)
    typical_free_time: str = "10 minutes"
    preferred_activity_type: str = "creative"
    main_personal_goal: str = "Focus / Study"
    preferred_reward_style: str = "mindful"
    avoid_activities: List[str] = Field(default_factory=list)
    difficulty_preference: str = "easy"
    social_solo_preference: str = "solo"
    creative_productive_relaxation: str = "creative"
    high_risk_periods: List[str] = Field(default_factory=lambda: ["evening"])


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    created_at: datetime
    profile: Optional[UserProfileResponse] = None
