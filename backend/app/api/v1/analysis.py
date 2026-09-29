import json
from datetime import datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User
from backend.app.models.usage import UsageSession, Notification
from backend.app.models.habit import HabitLoop, HabitLoopEvidence
from backend.app.models.insight import Insight
from backend.app.models.analysis import AnalysisRun
from backend.app.schemas.common import ApiResponse
from backend.app.analytics.engine import (
    detect_notification_associated_sessions,
    detect_habit_loops,
    calculate_dashboard_metrics,
    calculate_progress_trends
)
from backend.app.services.ai.kimi_client import kimi_client
from backend.app.config import settings

router = APIRouter()


@router.post("/run", response_model=ApiResponse[dict])
async def run_behavioral_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes behavioral pattern analysis on imported usage and notifications.
    Strict pipeline:
    1. Python analytics calculates ground truth statistics and habit loops
    2. Ground truth evidence is structured
    3. Kimi K3 generates explainable insights (with deterministic fallback)
    4. Results are persisted to database
    """
    analysis_run = AnalysisRun(
        user_id=current_user.id,
        status="processing"
    )
    db.add(analysis_run)
    db.commit()
    db.refresh(analysis_run)

    # 1. Fetch user sessions & notifications
    sessions = db.query(UsageSession).filter(UsageSession.user_id == current_user.id).order_by(UsageSession.start_time.asc()).all()
    notifications = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.timestamp.asc()).all()

    if not sessions:
        analysis_run.status = "completed"
        analysis_run.error_message = "No usage sessions to analyze."
        db.commit()
        return ApiResponse(
            success=True,
            data={"run_id": str(analysis_run.id), "status": "completed", "habit_loops_detected": 0},
            message="No usage data found. Please import sample CSV first."
        )

    # Convert to dictionaries for analytics engine
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
    notif_dicts = [
        {
            "id": n.id,
            "app_name": n.app_name,
            "timestamp": n.timestamp,
            "title": n.title
        }
        for n in notifications
    ]

    # 2. Notification association logic (within 3 minutes)
    enriched_sessions = detect_notification_associated_sessions(
        session_dicts,
        notif_dicts,
        window_minutes=settings.HABIT_LOOP_NOTIFICATION_WINDOW_MINUTES
    )

    # Update sessions in db with verified notification associations
    for s_dict in enriched_sessions:
        if s_dict.get("notification_associated") and s_dict.get("matched_notification"):
            db_s = db.query(UsageSession).filter(UsageSession.id == s_dict["id"]).first()
            if db_s:
                db_s.notification_associated = True
                db_s.notification_id = s_dict["matched_notification"]["id"]

    # 3. Detect Habit Loops
    detected_loops = detect_habit_loops(
        enriched_sessions,
        min_occurrences=settings.HABIT_LOOP_MIN_OCCURRENCES,
        analysis_days=settings.HABIT_LOOP_ANALYSIS_DAYS,
        time_window_hours=settings.HABIT_LOOP_TIME_WINDOW_HOURS
    )

    # 4. Calculate summary metrics
    metrics = calculate_dashboard_metrics(enriched_sessions, notif_dicts, detected_loops)

    # Persist habit loops to DB
    # Clear old active habit loops for fresh analysis
    db.query(HabitLoopEvidence).filter(
        HabitLoopEvidence.habit_loop_id.in_(
            db.query(HabitLoop.id).filter(HabitLoop.user_id == current_user.id)
        )
    ).delete(synchronize_session=False)
    db.query(HabitLoop).filter(HabitLoop.user_id == current_user.id).delete()

    created_habit_loops = []
    for loop in detected_loops:
        hl = HabitLoop(
            user_id=current_user.id,
            app_name=loop["app_name"],
            trigger_description=loop["trigger_description"],
            action_description=loop["action_description"],
            time_window_start=loop["time_window_start"],
            time_window_end=loop["time_window_end"],
            occurrences_count=loop["occurrences_count"],
            total_days_analyzed=loop["total_days_analyzed"],
            average_duration_minutes=loop["average_duration_minutes"],
            total_minutes_impact=loop["total_minutes_impact"],
            confidence=loop["confidence"],
            status="active",
            recommendation=loop["recommendation"]
        )
        db.add(hl)
        db.flush()

        for ev in loop["evidence_items"]:
            evidence_rec = HabitLoopEvidence(
                habit_loop_id=hl.id,
                session_timestamp=ev["session_timestamp"],
                session_duration_minutes=ev["session_duration_minutes"],
                notification_timestamp=ev["notification_timestamp"],
                notification_title=ev["notification_title"],
                latency_minutes=ev["latency_minutes"]
            )
            db.add(evidence_rec)
        created_habit_loops.append(hl)

    # 5. Generate AI Insights via Kimi K3 (or deterministic fallback)
    primary_loop = detected_loops[0] if detected_loops else None
    user_goal = current_user.profile.goal_lens if current_user.profile else "Reduce Digital Distraction"

    ai_insight_data = await kimi_client.generate_explainable_insight(
        evidence_data=metrics,
        habit_loop=primary_loop,
        user_goal=user_goal
    )

    # Clear old insights and save new
    db.query(Insight).filter(Insight.user_id == current_user.id).delete()

    main_insight = Insight(
        user_id=current_user.id,
        habit_loop_id=created_habit_loops[0].id if created_habit_loops else None,
        insight_type="biggest_insight",
        title=ai_insight_data.get("title", "Digital Day Insight"),
        observation=ai_insight_data.get("observation", "Observation"),
        evidence=json.dumps(ai_insight_data.get("evidence", [])),
        why_it_matters=ai_insight_data.get("why_it_matters", "Pattern importance"),
        recommendation=ai_insight_data.get("recommendation", "Recommended action"),
        confidence=ai_insight_data.get("confidence", "high"),
        source=ai_insight_data.get("source", "kimi")
    )
    db.add(main_insight)

    analysis_run.status = "completed"
    analysis_run.total_sessions_processed = len(sessions)
    analysis_run.total_notifications_processed = len(notifications)
    analysis_run.habit_loops_detected = len(created_habit_loops)
    analysis_run.completed_at = datetime.now(timezone.utc)

    db.commit()

    return ApiResponse(
        success=True,
        data={
            "run_id": str(analysis_run.id),
            "status": "completed",
            "sessions_processed": len(sessions),
            "notifications_processed": len(notifications),
            "habit_loops_detected": len(created_habit_loops),
            "insight_generated": main_insight.title,
            "insight_source": main_insight.source
        },
        message="Analysis completed successfully."
    )


@router.get("/status/{id}", response_model=ApiResponse[dict])
def get_analysis_status(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves status of an analysis run"""
    run = db.query(AnalysisRun).filter(
        AnalysisRun.id == id,
        AnalysisRun.user_id == current_user.id
    ).first()

    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis run not found")

    return ApiResponse(
        success=True,
        data={
            "id": str(run.id),
            "status": run.status,
            "sessions_processed": run.total_sessions_processed,
            "notifications_processed": run.total_notifications_processed,
            "habit_loops_detected": run.habit_loops_detected,
            "error_message": run.error_message,
            "created_at": run.created_at,
            "completed_at": run.completed_at
        },
        message="Analysis run status retrieved"
    )
