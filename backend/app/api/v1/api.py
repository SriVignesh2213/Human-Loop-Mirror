from fastapi import APIRouter
from backend.app.api.v1 import (
    health,
    users,
    usage,
    dashboard,
    digital_day,
    apps,
    notifications,
    habit_loops,
    insights,
    reflections,
    personal_swap,
    goals,
    progress,
    analysis,
    export
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(usage.router, prefix="/usage", tags=["Usage"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(digital_day.router, prefix="/digital-day", tags=["Digital Day"])
api_router.include_router(apps.router, prefix="/apps", tags=["Apps"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(habit_loops.router, prefix="/habit-loops", tags=["Habit Loops"])
api_router.include_router(insights.router, prefix="/insights", tags=["AI Insights"])
api_router.include_router(reflections.router, prefix="/reflections", tags=["Reflections"])
api_router.include_router(personal_swap.router, prefix="/personal-swap", tags=["Personal Swap"])
api_router.include_router(goals.router, prefix="/goals", tags=["Goals"])
api_router.include_router(progress.router, prefix="/progress", tags=["Progress"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
api_router.include_router(export.router, prefix="/export", tags=["Export & Privacy"])
