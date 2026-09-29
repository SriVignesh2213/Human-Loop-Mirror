from datetime import datetime, timedelta
from backend.app.analytics.engine import (
    detect_notification_associated_sessions,
    detect_habit_loops,
    calculate_dashboard_metrics,
    calculate_progress_trends
)


def test_notification_association_logic():
    t0 = datetime(2026, 9, 22, 20, 45, 0)
    # Session started 2 mins later (within 3 min window)
    t_session = datetime(2026, 9, 22, 20, 47, 0)

    sessions = [{
        "app_name": "Instagram",
        "start_time": t_session,
        "end_time": t_session + timedelta(minutes=30),
        "duration_minutes": 30.0
    }]
    notifications = [{
        "id": "1",
        "app_name": "Instagram",
        "timestamp": t0,
        "title": "New reel"
    }]

    enriched = detect_notification_associated_sessions(sessions, notifications, window_minutes=3)
    assert len(enriched) == 1
    assert enriched[0]["notification_associated"] is True
    assert enriched[0]["notification_latency_minutes"] == 2.0


def test_habit_loop_detection_requires_evidence():
    # 4 distinct days, Instagram opened around 20:50 for 35 mins
    sessions = []
    notifications = []
    base_day = datetime(2026, 9, 22, 20, 50, 0)

    for i in range(4):
        s_time = base_day + timedelta(days=i)
        n_time = s_time - timedelta(minutes=2)
        sessions.append({
            "app_name": "Instagram",
            "start_time": s_time,
            "end_time": s_time + timedelta(minutes=35),
            "duration_minutes": 35.0,
            "notification_associated": True,
            "matched_notification": {"timestamp": n_time, "title": "Friend posted"},
            "notification_latency_minutes": 2.0
        })
        notifications.append({
            "id": str(i),
            "app_name": "Instagram",
            "timestamp": n_time,
            "title": "Friend posted"
        })

    loops = detect_habit_loops(sessions, min_occurrences=3, analysis_days=7, time_window_hours=2)
    assert len(loops) >= 1
    loop = loops[0]
    assert loop["app_name"] == "Instagram"
    assert loop["occurrences_count"] == 4
    assert loop["confidence"] == "high"
    assert len(loop["evidence_items"]) == 4


def test_reclaimed_time_not_fabricated_when_no_decrease():
    # 2 days where screen time increased
    d1 = datetime(2026, 9, 22, 10, 0, 0)
    d2 = datetime(2026, 9, 23, 10, 0, 0)
    sessions = [
        {"app_name": "VS Code", "start_time": d1, "duration_minutes": 60.0},
        {"app_name": "VS Code", "start_time": d2, "duration_minutes": 120.0},
    ]
    trends = calculate_progress_trends(sessions, [], 0, 0)
    # Since screen time increased, time reclaimed must be None (never fabricated)
    assert trends["time_reclaimed_minutes"] is None
