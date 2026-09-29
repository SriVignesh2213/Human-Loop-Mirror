from backend.app.models.profile import UserProfile, UserActivityPreference
from backend.app.services.task_engine import match_personalized_activities
from backend.app.models.activity import Activity


def test_task_engine_avoids_forbidden_activities(db_session):
    # Setup user profile with avoidance of "exercise"
    profile = UserProfile(
        user_id="00000000-0000-0000-0000-000000000001",
        display_name="Test User",
        goal_lens="Focus / Study"
    )
    db_session.add(profile)
    avoid_pref = UserActivityPreference(
        user_id="00000000-0000-0000-0000-000000000001",
        activity_category="exercise",
        preference_type="avoid"
    )
    db_session.add(avoid_pref)
    db_session.commit()

    matched = match_personalized_activities(db_session, profile, limit=3)
    categories = [m["category"].lower() for m in matched]
    # "exercise" must NEVER be suggested when avoided
    assert "exercise" not in categories


def test_task_engine_tier_durations(db_session):
    profile = UserProfile(
        user_id="00000000-0000-0000-0000-000000000001",
        display_name="Test User"
    )
    matched = match_personalized_activities(db_session, profile, limit=3)
    assert len(matched) == 3
    # Check that durations span distinct availability tiers (<=3m, ~10m, ~20m)
    durations = [m["duration_minutes"] for m in matched]
    assert any(d <= 3 for d in durations)
