from typing import Optional, List
from pydantic import BaseModel
from backend.app.schemas.insight import InsightResponse
from backend.app.schemas.habit import HabitLoopResponse
from backend.app.schemas.goal import GoalResponse
from backend.app.schemas.swap import PersonalSwapSuggestionResponse


class DashboardSummaryResponse(BaseModel):
    total_screen_time_minutes: float
    total_screen_time_formatted: str
    peak_usage_period: str
    notification_triggered_sessions: int
    detected_habit_loops_count: int
    biggest_insight: Optional[InsightResponse] = None
    active_habit_loop: Optional[HabitLoopResponse] = None
    what_changed: str
    todays_goal: Optional[GoalResponse] = None
    personal_swap_suggested: Optional[PersonalSwapSuggestionResponse] = None
    recent_swaps: List[PersonalSwapSuggestionResponse] = []
