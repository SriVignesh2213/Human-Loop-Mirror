from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User
from backend.app.models.usage import UsageSession
from backend.app.models.habit import HabitLoop
from backend.app.models.swap import PersonalSwapSuggestion, PersonalSwapCompletion
from backend.app.schemas.common import ApiResponse
from backend.app.schemas.progress import ProgressOverviewResponse
from backend.app.analytics.engine import calculate_progress_trends

router = APIRouter()


@router.get("", response_model=ApiResponse[ProgressOverviewResponse])
def get_progress_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes verified progress metrics:
    - week-over-week screen time change
    - habit loop frequency
    - notification triggered session frequency
    - average session duration
    - Personal Swap completions
    - verified time reclaimed (never fabricated)
    - multi-week habit evolution
    """
    sessions = db.query(UsageSession).filter(
        UsageSession.user_id == current_user.id
    ).order_by(UsageSession.start_time.asc()).all()

    habit_loops = db.query(HabitLoop).filter(
        HabitLoop.user_id == current_user.id
    ).all()

    completed_swaps = db.query(PersonalSwapCompletion).filter(
        PersonalSwapCompletion.user_id == current_user.id
    ).count()

    started_swaps = db.query(PersonalSwapSuggestion).filter(
        PersonalSwapSuggestion.user_id == current_user.id,
        PersonalSwapSuggestion.status.in_(["started", "completed"])
    ).count()

    session_dicts = [
        {
            "id": s.id,
            "app_name": s.app_name,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "duration_minutes": s.duration_minutes,
            "is_long_session": s.is_long_session,
            "notification_associated": s.notification_associated
        }
        for s in sessions
    ]

    loop_dicts = [
        {
            "app_name": hl.app_name,
            "occurrences_count": hl.occurrences_count,
            "status": hl.status
        }
        for hl in habit_loops
    ]

    trends = calculate_progress_trends(
        sessions=session_dicts,
        habit_loops=loop_dicts,
        completed_swaps_count=completed_swaps,
        started_swaps_count=started_swaps
    )

    return ApiResponse(
        success=True,
        data=ProgressOverviewResponse(**trends),
        message="Progress data compiled"
    )
