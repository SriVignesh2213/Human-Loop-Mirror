import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User
from backend.app.models.usage import UsageSession, Notification
from backend.app.models.habit import HabitLoop
from backend.app.models.insight import Insight
from backend.app.models.goal import Goal
from backend.app.models.swap import PersonalSwapSuggestion
from backend.app.schemas.common import ApiResponse
from backend.app.schemas.dashboard import DashboardSummaryResponse
from backend.app.analytics.engine import calculate_dashboard_metrics

router = APIRouter()


@router.get("", response_model=ApiResponse[DashboardSummaryResponse])
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the real-time aggregated dashboard telemetry for the current user.
    All data is derived from verified database state.
    """
    sessions = db.query(UsageSession).filter(UsageSession.user_id == current_user.id).all()
    notifications = db.query(Notification).filter(Notification.user_id == current_user.id).all()
    habit_loops = db.query(HabitLoop).filter(HabitLoop.user_id == current_user.id).all()

    session_dicts = [
        {
            "app_name": s.app_name,
            "start_time": s.start_time,
            "duration_minutes": s.duration_minutes,
            "notification_associated": s.notification_associated
        }
        for s in sessions
    ]
    notif_dicts = [{"app_name": n.app_name, "timestamp": n.timestamp} for n in notifications]
    loop_dicts = [{"app_name": h.app_name, "occurrences_count": h.occurrences_count} for h in habit_loops]

    metrics = calculate_dashboard_metrics(session_dicts, notif_dicts, loop_dicts)

    # Fetch main insight
    main_insight_rec = db.query(Insight).filter(
        Insight.user_id == current_user.id,
        Insight.insight_type == "biggest_insight"
    ).order_by(Insight.created_at.desc()).first()

    biggest_insight = None
    if main_insight_rec:
        raw_evidence = []
        if main_insight_rec.evidence:
            try:
                raw_evidence = json.loads(main_insight_rec.evidence)
            except Exception:
                raw_evidence = [main_insight_rec.evidence]
        clean_evidence = [
            item["label"] if isinstance(item, dict) and "label" in item
            else item.get("text", str(item)) if isinstance(item, dict)
            else str(item)
            for item in (raw_evidence if isinstance(raw_evidence, list) else [raw_evidence])
        ]
        biggest_insight = {
            "id": main_insight_rec.id,
            "type": main_insight_rec.insight_type,
            "title": main_insight_rec.title,
            "observation": main_insight_rec.observation,
            "evidence": clean_evidence,
            "why_it_matters": main_insight_rec.why_it_matters,
            "recommendation": main_insight_rec.recommendation,
            "confidence": main_insight_rec.confidence,
            "source": main_insight_rec.source,
            "created_at": main_insight_rec.created_at,
            "habit_loop_id": main_insight_rec.habit_loop_id
        }


    # Fetch active habit loop
    active_loop_rec = db.query(HabitLoop).filter(
        HabitLoop.user_id == current_user.id,
        HabitLoop.status == "active"
    ).order_by(HabitLoop.total_minutes_impact.desc()).first()

    active_habit_loop = None
    if active_loop_rec:
        active_habit_loop = {
            "id": active_loop_rec.id,
            "app_name": active_loop_rec.app_name,
            "trigger_description": active_loop_rec.trigger_description,
            "action_description": active_loop_rec.action_description,
            "time_window_start": active_loop_rec.time_window_start,
            "time_window_end": active_loop_rec.time_window_end,
            "occurrences_count": active_loop_rec.occurrences_count,
            "total_days_analyzed": active_loop_rec.total_days_analyzed,
            "average_duration_minutes": active_loop_rec.average_duration_minutes,
            "total_minutes_impact": active_loop_rec.total_minutes_impact,
            "confidence": active_loop_rec.confidence,
            "status": active_loop_rec.status,
            "recommendation": active_loop_rec.recommendation,
            "last_detected_at": active_loop_rec.last_detected_at,
            "created_at": active_loop_rec.created_at
        }

    # Today's goal
    goal_rec = db.query(Goal).filter(
        Goal.user_id == current_user.id,
        Goal.status == "active"
    ).first()

    todays_goal = None
    if goal_rec:
        todays_goal = {
            "id": goal_rec.id,
            "goal_lens": goal_rec.goal_lens,
            "title": goal_rec.title,
            "target_metric": goal_rec.target_metric,
            "target_value": goal_rec.target_value,
            "current_value": goal_rec.current_value,
            "unit": goal_rec.unit,
            "status": goal_rec.status,
            "explanation": goal_rec.explanation,
            "created_at": goal_rec.created_at,
            "updated_at": goal_rec.updated_at
        }

    # Suggested Personal Swap
    swap_rec = db.query(PersonalSwapSuggestion).filter(
        PersonalSwapSuggestion.user_id == current_user.id,
        PersonalSwapSuggestion.status.in_(["suggested", "chosen", "started"])
    ).order_by(PersonalSwapSuggestion.created_at.desc()).first()

    personal_swap_suggested = None
    if swap_rec:
        personal_swap_suggested = {
            "id": swap_rec.id,
            "habit_loop_id": swap_rec.habit_loop_id,
            "activity_id": swap_rec.activity_id,
            "title": swap_rec.title,
            "category": swap_rec.category,
            "duration_minutes": swap_rec.duration_minutes,
            "difficulty": swap_rec.difficulty,
            "reason": swap_rec.reason,
            "user_fit": swap_rec.user_fit,
            "reward_type": swap_rec.reward_type,
            "status": swap_rec.status,
            "created_at": swap_rec.created_at
        }

    # What changed explanation
    if len(sessions) > 0 and len(habit_loops) > 0:
        what_changed = f"Identified {len(habit_loops)} repeated habit loop patterns with {metrics['notification_triggered_sessions']} sessions following immediate notifications."
    elif len(sessions) > 0:
        what_changed = f"Recorded {len(sessions)} app sessions across {len(metrics['top_apps'])} applications. Run analysis to detect habit loops."
    else:
        what_changed = "No usage recorded yet. Import your demo dataset or log a session to mirror your habit loops."

    return ApiResponse(
        success=True,
        data=DashboardSummaryResponse(
            total_screen_time_minutes=metrics["total_screen_time_minutes"],
            total_screen_time_formatted=metrics["total_screen_time_formatted"],
            peak_usage_period=metrics["peak_usage_period"],
            notification_triggered_sessions=metrics["notification_triggered_sessions"],
            detected_habit_loops_count=metrics["detected_habit_loops_count"],
            biggest_insight=biggest_insight,
            active_habit_loop=active_habit_loop,
            what_changed=what_changed,
            todays_goal=todays_goal,
            personal_swap_suggested=personal_swap_suggested
        ),
        message="Dashboard summary retrieved"
    )
