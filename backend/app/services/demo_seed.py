import uuid
import json
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from backend.app.models.user import User
from backend.app.models.profile import UserProfile
from backend.app.models.usage import Application, UsageSession, Notification
from backend.app.models.habit import HabitLoop
from backend.app.models.insight import Insight
from backend.app.models.reflection import Reflection
from backend.app.models.goal import Goal
from backend.app.models.swap import PersonalSwapSuggestion
from backend.app.utils.logger import logger


DEMO_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


def seed_demo_usage_if_empty(db: Session):
    """
    Ensures the demo user has rich, dynamic usage telemetry relative to the current date.
    All timestamps are generated relative to datetime.now(), so dates and times are never stale.
    """
    session_count = db.query(UsageSession).filter(UsageSession.user_id == DEMO_USER_ID).count()
    if session_count > 0:
        return

    logger.info("Seeding dynamic live telemetry for demo user relative to today...")

    # Ensure user exists
    user = db.query(User).filter(User.id == DEMO_USER_ID).first()
    if not user:
        user = User(
            id=DEMO_USER_ID,
            email="demo@habitloopmirror.dev"
        )
        db.add(user)
        db.flush()

        profile = UserProfile(
            user_id=user.id,
            display_name="Demo User",
            onboarding_completed=True,
            preferred_activity_duration=10,
            goal_lens="Sleep Preservation",
            timezone="UTC"
        )
        db.add(profile)
        db.flush()

    # Applications catalog
    apps_data = [
        ("Instagram", "Social"),
        ("Slack", "Productivity"),
        ("VS Code", "Development"),
        ("YouTube", "Entertainment"),
        ("Spotify", "Entertainment"),
        ("Notion", "Productivity"),
        ("Twitter", "Social"),
        ("Kindle", "Reading"),
        ("Chrome", "Browsing")
    ]
    apps_map = {}
    for name, cat in apps_data:
        app = db.query(Application).filter(Application.name == name).first()
        if not app:
            app = Application(name=name, category=cat)
            db.add(app)
            db.flush()
        apps_map[name] = app

    now = datetime.now()
    today = now.date()

    # 7-day schedule pattern relative to today
    # (day_offset, start_hour, start_min, duration_min, app_name, notif_title, reflection_label, notes)
    patterns = [
        # Today
        (0, 8, 15, 30, "Slack", "Team standup reminder", "Necessary", "Reviewing overnight deployments"),
        (0, 9, 30, 150, "VS Code", None, "Planned", "Feature development sprint"),
        (0, 12, 15, 25, "YouTube", None, "Relaxation", "Tech talk while eating lunch"),
        (0, 14, 0, 150, "VS Code", None, "Planned", "Architecture refactoring"),
        (0, 18, 5, 35, "Spotify", None, "Relaxation", "Evening wind-down playlist"),
        (0, 20, 45, 42, "Instagram", "Sarah sent a reel: Modern Architecture", "Unplanned", "Opened alert, drifted into reels"),
        (0, 22, 15, 28, "Notion", None, "Planned", "Personal daily planning"),

        # Yesterday
        (1, 8, 30, 25, "Slack", "Deployment alert: Staging ready", "Necessary", "Checked pull request reviews"),
        (1, 9, 30, 165, "VS Code", None, "Planned", "Frontend component engineering"),
        (1, 13, 0, 30, "YouTube", None, "Relaxation", "Design trends podcast"),
        (1, 14, 30, 150, "VS Code", None, "Planned", "API integration tests"),
        (1, 19, 0, 35, "Twitter", "Breaking update in AI engineering", "Unplanned", "Quick check turned into thread reading"),
        (1, 20, 50, 38, "Instagram", "Trending post from @designers", "Unplanned", "Notification triggered explore feed"),
        (1, 22, 30, 30, "Kindle", None, "Planned", "Evening book chapter"),

        # 2 days ago
        (2, 8, 20, 30, "Slack", "Morning announcements", "Necessary", "Sprint retro comments"),
        (2, 9, 15, 180, "VS Code", None, "Planned", "Full-stack module refactoring"),
        (2, 13, 10, 25, "YouTube", None, "Relaxation", "Quick break"),
        (2, 15, 0, 150, "VS Code", None, "Planned", "Unit test coverage"),
        (2, 18, 0, 25, "Spotify", None, "Relaxation", "End of workday calm"),
        (2, 20, 52, 40, "Instagram", "Alex tagged you in a photo", "Unplanned", "Notification prompt expanded into feed"),
        (2, 22, 15, 25, "Notion", None, "Planned", "Sprint planning review"),

        # 3 days ago
        (3, 8, 45, 25, "Slack", "CI/CD Pipeline failed on main", "Necessary", "Hotfix deployment review"),
        (3, 9, 30, 150, "VS Code", None, "Planned", "Hotfix coding and PR"),
        (3, 14, 0, 150, "VS Code", None, "Planned", "Database schema migration"),
        (3, 18, 30, 35, "YouTube", None, "Relaxation", "Cooking video"),
        (3, 20, 48, 36, "Instagram", "Direct message received", "Unplanned", "Opened message, kept scrolling for 35m"),

        # 4 days ago
        (4, 10, 0, 60, "Kindle", None, "Planned", "Weekend reading"),
        (4, 11, 30, 45, "YouTube", None, "Relaxation", "Documentary watching"),
        (4, 14, 0, 90, "VS Code", None, "Planned", "Side project exploration"),
        (4, 21, 10, 42, "Instagram", "Jordan posted a story update", "Unplanned", "Late night impulse scroll"),

        # 5 days ago
        (5, 9, 30, 60, "Notion", None, "Planned", "Weekly goals review"),
        (5, 11, 0, 75, "YouTube", None, "Relaxation", "Music production stream"),
        (5, 16, 0, 60, "Spotify", None, "Relaxation", "Afternoon chill session"),
        (5, 20, 40, 35, "Instagram", "3 new direct messages", "Unplanned", "Post-dinner browsing sequence"),

        # 6 days ago
        (6, 8, 30, 30, "Slack", "Weekly kickoff agenda", "Necessary", "Team sync preparation"),
        (6, 9, 30, 180, "VS Code", None, "Planned", "Project kickoff implementation"),
        (6, 14, 0, 150, "VS Code", None, "Planned", "Core logic development"),
        (6, 20, 55, 35, "Instagram", "New reel recommendation", "Unplanned", "Evening bed browsing session"),
        (6, 22, 30, 30, "Kindle", None, "Relaxation", "Bedtime reading")
    ]

    for offset, hour, minute, dur_mins, app_name, notif_title, refl_label, notes in patterns:
        session_date = today - timedelta(days=offset)
        start_time = datetime(session_date.year, session_date.month, session_date.day, hour, minute)
        end_time = start_time + timedelta(minutes=dur_mins)
        app_obj = apps_map[app_name]

        notif_id = None
        if notif_title:
            notif_time = start_time - timedelta(seconds=85)
            notif = Notification(
                user_id=user.id,
                app_id=app_obj.id,
                app_name=app_name,
                timestamp=notif_time,
                title=notif_title,
                content_preview=notif_title
            )
            db.add(notif)
            db.flush()
            notif_id = notif.id

        session = UsageSession(
            user_id=user.id,
            app_id=app_obj.id,
            app_name=app_name,
            start_time=start_time,
            end_time=end_time,
            duration_minutes=dur_mins,
            is_long_session=(dur_mins >= 30),
            notification_associated=(notif_id is not None),
            notification_id=notif_id,
            reflection_label=refl_label
        )
        db.add(session)
        db.flush()

        # Add reflection record with informative prompt title (e.g., app name + duration)
        if refl_label:
            reflection = Reflection(
                user_id=user.id,
                session_id=session.id,
                intentionality_label=refl_label,
                notes=notes,
                prompt_answered=f"{app_name} • {dur_mins} min session"
            )
            reflection.created_at = end_time
            db.add(reflection)

    # Seed Detected Habit Loop
    habit_loop = HabitLoop(
        user_id=user.id,
        app_name="Instagram",
        trigger_description="Evening direct message alert between 8:00 PM and 10:30 PM",
        action_description="Unplanned social media browsing sequence",
        time_window_start="20:00",
        time_window_end="22:30",
        occurrences_count=6,
        average_duration_minutes=37.5,
        confidence="high"
    )
    db.add(habit_loop)
    db.flush()

    # Seed Biggest Insight
    insight = Insight(
        user_id=user.id,
        insight_type="biggest_insight",
        title="Evening Notification Association",
        observation="Your late-night phone activations frequently follow notification alerts received after 8:30 PM.",
        evidence=json.dumps([
            "83% of evening Instagram sessions followed an alert within 2 minutes",
            "Average duration: 37.5 minutes vs 12 minutes planned daytime usage",
            "Bedtime routines delayed by an average of 42 minutes"
        ]),
        why_it_matters="Evening screen engagement clusters into multi-app sequences, delaying planned sleep schedules.",
        recommendation="Mute non-essential notifications between 8:30 PM and 10:30 PM to preserve evening wind-down buffer.",
        confidence="high"
    )
    db.add(insight)

    # Seed Active Goals
    goal1 = Goal(
        user_id=user.id,
        goal_lens="Sleep",
        title="Preserve Evening Sleep Buffer",
        explanation="Screen-off by 10:30 PM to ensure relaxing bedtime transition without notification triggers.",
        target_metric="daily_screen_time_minutes",
        target_value=120.0,
        current_value=135.0,
        unit="minutes/day",
        status="active"
    )
    goal2 = Goal(
        user_id=user.id,
        goal_lens="Focus / Study",
        title="Deep Focus Coding Blocks",
        explanation="Preserve uninterrupted daytime programming sessions on VS Code.",
        target_metric="daily_screen_time_minutes",
        target_value=240.0,
        current_value=210.0,
        unit="minutes/day",
        status="active"
    )
    db.add(goal1)
    db.add(goal2)

    db.commit()
    logger.info("Dynamic demo telemetry successfully seeded for demo user!")
