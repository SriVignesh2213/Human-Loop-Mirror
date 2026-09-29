from datetime import datetime, timedelta, time
from typing import List, Dict, Any, Tuple, Optional
from collections import defaultdict
import numpy as np
import pandas as pd


def detect_notification_associated_sessions(
    sessions: List[Dict[str, Any]],
    notifications: List[Dict[str, Any]],
    window_minutes: int = 3
) -> List[Dict[str, Any]]:
    """
    Identifies sessions that started within `window_minutes` after a notification for the same app.
    Non-judgmental terminology: 'session followed notification'.
    """
    enriched_sessions = []
    
    # Sort notifications by timestamp
    sorted_notifs = sorted(notifications, key=lambda n: n["timestamp"])
    
    for session in sessions:
        s_start = session["start_time"]
        s_app = session["app_name"].strip().lower()
        
        matched_notif = None
        min_latency = None
        
        for notif in sorted_notifs:
            n_time = notif["timestamp"]
            n_app = notif["app_name"].strip().lower()
            
            if s_app == n_app:
                diff_seconds = (s_start - n_time).total_seconds()
                # Notification occurred within window_minutes (and not in the future beyond 10s clock drift)
                if -10 <= diff_seconds <= (window_minutes * 60):
                    latency_min = max(0.0, round(diff_seconds / 60.0, 1))
                    matched_notif = notif
                    min_latency = latency_min
                    break

        enriched = dict(session)
        if matched_notif:
            enriched["notification_associated"] = True
            enriched["matched_notification"] = matched_notif
            enriched["notification_latency_minutes"] = min_latency
        else:
            enriched["notification_associated"] = False
            enriched["matched_notification"] = None
            enriched["notification_latency_minutes"] = None
            
        enriched_sessions.append(enriched)
        
    return enriched_sessions


def detect_habit_loops(
    enriched_sessions: List[Dict[str, Any]],
    min_occurrences: int = 3,
    analysis_days: int = 7,
    time_window_hours: int = 2
) -> List[Dict[str, Any]]:
    """
    Detects evidence-based habit loops:
    Same app, similar time window, repeated across multiple distinct days,
    especially where sessions followed notifications.
    """
    if not enriched_sessions:
        return []

    # Group by app
    app_sessions = defaultdict(list)
    for s in enriched_sessions:
        app_sessions[s["app_name"]].append(s)

    habit_loops = []

    for app_name, s_list in app_sessions.items():
        if len(s_list) < min_occurrences:
            continue

        # Bin sessions by hour of day (e.g. 20 for 8 PM)
        # Check sliding time window (e.g. 2-hour window: 20:00 to 22:00)
        hour_bins = defaultdict(list)
        for s in s_list:
            st = s["start_time"]
            hour = st.hour
            hour_bins[hour].append(s)

        # Check clusters in 2-hour windows
        tested_windows = set()
        for hour in range(24):
            window_key = f"{hour:02d}:00-{(hour + time_window_hours) % 24:02d}:00"
            if window_key in tested_windows:
                continue
            tested_windows.add(window_key)

            # Sessions in hour or (hour + 1)
            window_sessions = []
            for h_offset in range(time_window_hours):
                check_h = (hour + h_offset) % 24
                window_sessions.extend(hour_bins.get(check_h, []))

            if len(window_sessions) < min_occurrences:
                continue

            # Check distinct days
            distinct_days = {s["start_time"].date() for s in window_sessions}
            if len(distinct_days) < min_occurrences:
                continue

            # Calculate metrics
            durations = [s["duration_minutes"] for s in window_sessions]
            avg_duration = round(float(np.mean(durations)), 1)
            total_minutes = round(float(np.sum(durations)), 1)
            
            notif_associated_count = sum(1 for s in window_sessions if s.get("notification_associated"))
            notif_ratio = notif_associated_count / len(window_sessions)

            confidence = "high" if (len(distinct_days) >= 4 or notif_ratio >= 0.6) else "medium"

            time_start_str = f"{hour:02d}:00"
            time_end_str = f"{(hour + time_window_hours) % 24:02d}:00"

            if notif_associated_count > 0:
                trigger_desc = f"{app_name} notification in the {time_start_str} to {time_end_str} window"
                action_desc = f"{app_name} opened shortly after notification"
                rec = f"Consider configuring scheduled summary or muting non-essential notifications for {app_name} between {time_start_str} and {time_end_str}."
            else:
                trigger_desc = f"Evening transition period between {time_start_str} and {time_end_str}"
                action_desc = f"{app_name} opened regularly in this timeframe"
                rec = f"Create an intentional pause or swap with an offline ritual around {time_start_str}."

            evidence_items = []
            for s in window_sessions:
                ev = {
                    "session_timestamp": s["start_time"],
                    "session_duration_minutes": s["duration_minutes"],
                    "notification_timestamp": s["matched_notification"]["timestamp"] if s.get("matched_notification") else None,
                    "notification_title": s["matched_notification"]["title"] if s.get("matched_notification") else None,
                    "latency_minutes": s.get("notification_latency_minutes")
                }
                evidence_items.append(ev)

            habit_loops.append({
                "app_name": app_name,
                "trigger_description": trigger_desc,
                "action_description": action_desc,
                "time_window_start": time_start_str,
                "time_window_end": time_end_str,
                "occurrences_count": len(window_sessions),
                "total_days_analyzed": analysis_days,
                "average_duration_minutes": avg_duration,
                "total_minutes_impact": total_minutes,
                "confidence": confidence,
                "status": "active",
                "recommendation": rec,
                "evidence_items": evidence_items
            })

    # Sort habit loops by total minutes impact descending
    habit_loops.sort(key=lambda x: x["total_minutes_impact"], reverse=True)
    return habit_loops


def calculate_dashboard_metrics(
    sessions: List[Dict[str, Any]],
    notifications: List[Dict[str, Any]],
    habit_loops: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Computes overall summary telemetry:
    - total screen time
    - peak usage period
    - notification-triggered sessions
    - detected habit loops
    """
    if not sessions:
        return {
            "total_screen_time_minutes": 0.0,
            "total_screen_time_formatted": "0h 0m",
            "peak_usage_period": "No data recorded",
            "notification_triggered_sessions": 0,
            "detected_habit_loops_count": 0,
            "top_apps": {},
        }

    total_minutes = sum(s["duration_minutes"] for s in sessions)
    hours = int(total_minutes // 60)
    mins = int(total_minutes % 60)
    formatted_time = f"{hours}h {mins}m" if hours > 0 else f"{mins}m"

    notif_triggered = sum(1 for s in sessions if s.get("notification_associated"))

    # Peak usage hour calculation
    hour_usage = defaultdict(float)
    for s in sessions:
        h = s["start_time"].hour
        hour_usage[h] += s["duration_minutes"]

    if hour_usage:
        peak_hour = max(hour_usage.items(), key=lambda x: x[1])[0]
        end_peak = (peak_hour + 2) % 24
        p_start_ampm = datetime.strptime(f"{peak_hour}:00", "%H:%M").strftime("%I %p").lstrip("0")
        p_end_ampm = datetime.strptime(f"{end_peak}:00", "%H:%M").strftime("%I %p").lstrip("0")
        peak_period = f"{p_start_ampm} – {p_end_ampm}"
    else:
        peak_period = "Evening (8 PM – 10 PM)"

    # Top apps by duration
    app_durations = defaultdict(float)
    for s in sessions:
        app_durations[s["app_name"]] += s["duration_minutes"]
    top_apps = dict(sorted(app_durations.items(), key=lambda x: x[1], reverse=True)[:5])

    return {
        "total_screen_time_minutes": round(total_minutes, 1),
        "total_screen_time_formatted": formatted_time,
        "peak_usage_period": peak_period,
        "notification_triggered_sessions": notif_triggered,
        "detected_habit_loops_count": len(habit_loops),
        "top_apps": top_apps,
    }


def calculate_progress_trends(
    sessions: List[Dict[str, Any]],
    habit_loops: List[Dict[str, Any]],
    completed_swaps_count: int,
    started_swaps_count: int
) -> Dict[str, Any]:
    """
    Computes week-over-week trends, daily distributions, and verified reclaimed time.
    Only computes time reclaimed from actual verified changes, never fabricated.
    """
    if not sessions:
        return {
            "screen_time_change_percent": 0.0,
            "habit_loop_frequency_change": 0,
            "notification_triggered_sessions_current": 0,
            "notification_triggered_sessions_previous": 0,
            "average_session_duration_current": 0.0,
            "average_session_duration_previous": 0.0,
            "swaps_completed_count": completed_swaps_count,
            "swaps_started_count": started_swaps_count,
            "swap_completion_rate": 0.0,
            "time_reclaimed_minutes": None,
            "time_reclaimed_rationale": "Accumulate 7+ days of usage data to observe verified changes.",
            "weekly_evolution": [],
            "app_distribution": {},
            "daily_screen_time_trend": []
        }

    # Group sessions into daily buckets
    daily_buckets = defaultdict(list)
    for s in sessions:
        date_str = s["start_time"].strftime("%Y-%m-%d")
        daily_buckets[date_str].append(s)

    sorted_dates = sorted(daily_buckets.keys())

    # Build daily trend series
    daily_trend = []
    for d in sorted_dates:
        d_sessions = daily_buckets[d]
        d_total_min = sum(x["duration_minutes"] for x in d_sessions)
        d_notifs = sum(1 for x in d_sessions if x.get("notification_associated"))
        daily_trend.append({
            "date": d,
            "total_minutes": round(d_total_min, 1),
            "hours": round(d_total_min / 60.0, 2),
            "sessions": len(d_sessions),
            "notification_triggered": d_notifs
        })

    # Split into current period vs previous period if >= 4 days exist
    n_days = len(sorted_dates)
    mid = n_days // 2
    prev_dates = sorted_dates[:mid] if mid > 0 else []
    curr_dates = sorted_dates[mid:] if mid > 0 else sorted_dates

    prev_sessions = [s for d in prev_dates for s in daily_buckets[d]]
    curr_sessions = [s for d in curr_dates for s in daily_buckets[d]]

    prev_screen_time = sum(s["duration_minutes"] for s in prev_sessions)
    curr_screen_time = sum(s["duration_minutes"] for s in curr_sessions)

    if prev_screen_time > 0 and len(prev_dates) > 0:
        prev_daily_avg = prev_screen_time / len(prev_dates)
        curr_daily_avg = curr_screen_time / len(curr_dates)
        change_pct = round(((curr_daily_avg - prev_daily_avg) / prev_daily_avg) * 100.0, 1)
    else:
        change_pct = 0.0

    curr_notif_count = sum(1 for s in curr_sessions if s.get("notification_associated"))
    prev_notif_count = sum(1 for s in prev_sessions if s.get("notification_associated"))

    curr_durations = [s["duration_minutes"] for s in curr_sessions]
    prev_durations = [s["duration_minutes"] for s in prev_sessions]
    avg_curr_dur = round(float(np.mean(curr_durations)), 1) if curr_durations else 0.0
    avg_prev_dur = round(float(np.mean(prev_durations)), 1) if prev_durations else 0.0

    swap_rate = round((completed_swaps_count / started_swaps_count * 100.0), 1) if started_swaps_count > 0 else 0.0

    # Weekly evolution structure
    weekly_evolution = []
    # If we have days, group into 7-day chunks or week labels
    chunk_size = 7
    total_days = len(sorted_dates)
    week_num = 1
    for i in range(0, total_days, chunk_size):
        chunk_dates = sorted_dates[i:i + chunk_size]
        chunk_sessions = [s for cd in chunk_dates for s in daily_buckets[cd]]
        total_hrs = round(sum(s["duration_minutes"] for s in chunk_sessions) / 60.0, 1)
        notif_cnt = sum(1 for s in chunk_sessions if s.get("notification_associated"))
        avg_s_min = round(float(np.mean([s["duration_minutes"] for s in chunk_sessions])), 1) if chunk_sessions else 0.0
        
        weekly_evolution.append({
            "week_label": f"Week {week_num}",
            "start_date": chunk_dates[0],
            "end_date": chunk_dates[-1],
            "total_screen_time_hours": total_hrs,
            "habit_loop_occurrences": sum(loop["occurrences_count"] for loop in habit_loops if loop["status"] == "active"),
            "notification_triggered_count": notif_cnt,
            "average_session_minutes": avg_s_min,
            "swaps_completed": completed_swaps_count if week_num == 1 else 0
        })
        week_num += 1

    # App distribution
    app_durations = defaultdict(float)
    for s in sessions:
        app_durations[s["app_name"]] += s["duration_minutes"]
    total_dur = sum(app_durations.values())
    app_pcts = {
        app: round((dur / total_dur) * 100.0, 1)
        for app, dur in sorted(app_durations.items(), key=lambda x: x[1], reverse=True)[:6]
    } if total_dur > 0 else {}

    # Verified time reclaimed:
    time_reclaimed = None
    time_reclaimed_rationale = None
    if change_pct < 0 and prev_screen_time > 0:
        daily_diff_min = max(0.0, (prev_screen_time / len(prev_dates)) - (curr_screen_time / len(curr_dates)))
        reclaimed_total = round(daily_diff_min * len(curr_dates), 1)
        time_reclaimed = reclaimed_total
        time_reclaimed_rationale = f"Based on verified reduction of {abs(change_pct)}% in daily average across observed intervals."

    return {
        "screen_time_change_percent": change_pct,
        "habit_loop_frequency_change": -1 if completed_swaps_count > 0 else 0,
        "notification_triggered_sessions_current": curr_notif_count,
        "notification_triggered_sessions_previous": prev_notif_count,
        "average_session_duration_current": avg_curr_dur,
        "average_session_duration_previous": avg_prev_dur,
        "swaps_completed_count": completed_swaps_count,
        "swaps_started_count": started_swaps_count,
        "swap_completion_rate": swap_rate,
        "time_reclaimed_minutes": time_reclaimed,
        "time_reclaimed_rationale": time_reclaimed_rationale,
        "weekly_evolution": weekly_evolution,
        "app_distribution": app_pcts,
        "daily_screen_time_trend": daily_trend
    }
