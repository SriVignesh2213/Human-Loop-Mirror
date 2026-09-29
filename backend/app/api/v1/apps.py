from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User
from backend.app.models.usage import Application
from backend.app.schemas.common import ApiResponse
from backend.app.schemas.usage import ApplicationResponse

router = APIRouter()


@router.get("", response_model=ApiResponse[List[ApplicationResponse]])
def get_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all tracked applications"""
    apps = db.query(Application).order_by(Application.name.asc()).all()
    return ApiResponse(
        success=True,
        data=[
            ApplicationResponse(
                id=a.id,
                name=a.name,
                category=a.category,
                icon_name=a.icon_name
            )
            for a in apps
        ],
        message="Applications retrieved"
    )


@router.get("/tracking", response_model=ApiResponse[dict])
def get_app_tracking(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculates detailed application tracking:
    - Time spent per app
    - Categorized usage aggregation (Social, Productivity, Entertainment, Development, etc.)
    - Session counts and notification-triggered ratios
    """
    from collections import defaultdict
    from backend.app.models.usage import UsageSession

    sessions = db.query(UsageSession).filter(UsageSession.user_id == current_user.id).all()
    apps = {a.name.lower(): a for a in db.query(Application).all()}

    app_stats = defaultdict(lambda: {"total_minutes": 0.0, "session_count": 0, "notification_count": 0, "category": "General"})
    cat_stats = defaultdict(lambda: {"total_minutes": 0.0, "session_count": 0, "apps": set()})
    total_screen_time = 0.0

    for s in sessions:
        dur = s.duration_minutes
        total_screen_time += dur
        app_name = s.app_name
        app_key = app_name.lower()

        cat = apps[app_key].category if app_key in apps else "General"

        app_stats[app_name]["total_minutes"] += dur
        app_stats[app_name]["session_count"] += 1
        app_stats[app_name]["category"] = cat
        if s.notification_associated:
            app_stats[app_name]["notification_count"] += 1

        cat_stats[cat]["total_minutes"] += dur
        cat_stats[cat]["session_count"] += 1
        cat_stats[cat]["apps"].add(app_name)

    # Format app list
    tracked_apps = []
    for app_name, stat in sorted(app_stats.items(), key=lambda x: x[1]["total_minutes"], reverse=True):
        pct = round((stat["total_minutes"] / total_screen_time * 100.0), 1) if total_screen_time > 0 else 0.0
        tracked_apps.append({
            "app_name": app_name,
            "category": stat["category"],
            "total_minutes": round(stat["total_minutes"], 1),
            "session_count": stat["session_count"],
            "notification_count": stat["notification_count"],
            "percentage": pct
        })

    # Format category list
    categories = []
    for cat_name, stat in sorted(cat_stats.items(), key=lambda x: x[1]["total_minutes"], reverse=True):
        pct = round((stat["total_minutes"] / total_screen_time * 100.0), 1) if total_screen_time > 0 else 0.0
        categories.append({
            "category": cat_name,
            "total_minutes": round(stat["total_minutes"], 1),
            "session_count": stat["session_count"],
            "apps": sorted(list(stat["apps"])),
            "percentage": pct
        })

    return ApiResponse(
        success=True,
        data={
            "total_screen_time_minutes": round(total_screen_time, 1),
            "total_sessions": len(sessions),
            "apps": tracked_apps,
            "categories": categories
        },
        message="Application and category tracking calculated successfully"
    )
