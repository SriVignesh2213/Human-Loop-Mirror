from typing import List, Dict, Optional
from pydantic import BaseModel


class HabitEvolutionWeek(BaseModel):
    week_label: str
    start_date: str
    end_date: str
    total_screen_time_hours: float
    habit_loop_occurrences: int
    notification_triggered_count: int
    average_session_minutes: float
    swaps_completed: int


class ProgressOverviewResponse(BaseModel):
    screen_time_change_percent: float  # e.g., -12.5%
    habit_loop_frequency_change: int   # e.g., -3
    notification_triggered_sessions_current: int
    notification_triggered_sessions_previous: int
    average_session_duration_current: float
    average_session_duration_previous: float
    swaps_completed_count: int
    swaps_started_count: int
    swap_completion_rate: float
    time_reclaimed_minutes: Optional[float] = None
    time_reclaimed_rationale: Optional[str] = None
    weekly_evolution: List[HabitEvolutionWeek]
    app_distribution: Dict[str, float]
    daily_screen_time_trend: List[Dict[str, float | str]]
