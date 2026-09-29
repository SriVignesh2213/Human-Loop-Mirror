from datetime import datetime, timedelta
from typing import Optional, List
from collections import defaultdict
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User
from backend.app.models.usage import UsageSession, Notification
from backend.app.schemas.common import ApiResponse
from backend.app.schemas.digital_day import DigitalDayResponse, DigitalDayEvent

router = APIRouter()


@router.get("", response_model=ApiResponse[DigitalDayResponse])
def get_digital_day_timeline(
    view: str = Query("day", pattern="^(day|week)$"),
    filter_type: str = Query("all", pattern="^(all|notification_triggered|long_sessions|late_night|intentional|unplanned)$"),
    date_str: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns chronological timeline events with rich filtering:
    - day / week views
    - filters: all, notification_triggered, long_sessions, late_night, intentional, unplanned
    - maintains strict non-judgmental language
    """
    query = db.query(UsageSession).filter(UsageSession.user_id == current_user.id)

    # Date handling
    if date_str:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            target_date = datetime.now().date()
    else:
        # Find latest session date or today
        latest_session = query.order_by(UsageSession.start_time.desc()).first()
        target_date = latest_session.start_time.date() if latest_session else datetime.now().date()

    if view == "day":
        start_dt = datetime.combine(target_date, datetime.min.time())
        end_dt = datetime.combine(target_date, datetime.max.time())
        query = query.filter(UsageSession.start_time >= start_dt, UsageSession.start_time <= end_dt)
    else:  # week
        start_dt = datetime.combine(target_date - timedelta(days=6), datetime.min.time())
        end_dt = datetime.combine(target_date, datetime.max.time())
        query = query.filter(UsageSession.start_time >= start_dt, UsageSession.start_time <= end_dt)

    sessions = query.order_by(UsageSession.start_time.asc()).all()

    # Apply filter
    filtered_sessions = []
    for s in sessions:
        if filter_type == "notification_triggered" and not s.notification_associated:
            continue
        if filter_type == "long_sessions" and not s.is_long_session:
            continue
        if filter_type == "late_night" and not (s.start_time.hour >= 22 or s.start_time.hour < 5):
            continue
        if filter_type == "intentional" and s.reflection_label not in ["Planned", "Necessary"]:
            continue
        if filter_type == "unplanned" and s.reflection_label != "Unplanned":
            continue
        filtered_sessions.append(s)

    # Compile events
    events: List[DigitalDayEvent] = []
    long_count = 0
    late_count = 0
    notif_count = 0
    total_screen_time = 0.0
    app_durations = defaultdict(float)

    for s in filtered_sessions:
        total_screen_time += s.duration_minutes
        app_durations[s.app_name] += s.duration_minutes

        if s.is_long_session:
            long_count += 1
        if s.start_time.hour >= 22 or s.start_time.hour < 5:
            late_count += 1
        if s.notification_associated:
            notif_count += 1

        notif_title = s.associated_notification.title if s.associated_notification else None
        details = f"{round(s.duration_minutes)} min session"
        if s.notification_associated:
            details += " (session followed notification)"

        events.append(DigitalDayEvent(
            id=s.id,
            event_type="session",
            timestamp=s.start_time,
            end_time=s.end_time,
            app_name=s.app_name,
            duration_minutes=s.duration_minutes,
            is_long_session=s.is_long_session,
            notification_associated=s.notification_associated,
            notification_title=notif_title,
            reflection_label=s.reflection_label,
            details=details
        ))

    return ApiResponse(
        success=True,
        data=DigitalDayResponse(
            date=target_date.strftime("%Y-%m-%d"),
            view_type=view,
            events=events,
            total_screen_time_minutes=round(total_screen_time, 1),
            total_sessions=len(filtered_sessions),
            notification_triggered_count=notif_count,
            long_sessions_count=long_count,
            late_night_count=late_count,
            top_apps=dict(sorted(app_durations.items(), key=lambda x: x[1], reverse=True)[:5])
        ),
        message="Digital Day timeline loaded"
    )
