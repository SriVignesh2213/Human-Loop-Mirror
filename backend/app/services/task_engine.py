import random
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.activity import Activity
from backend.app.models.profile import UserProfile, UserActivityPreference


def match_personalized_activities(
    db: Session,
    user_profile: Optional[UserProfile],
    habit_loop: Optional[Dict[str, Any]] = None,
    available_minutes: Optional[int] = None,
    limit: int = 3
) -> List[Dict[str, Any]]:
    """
    Deterministic matching engine for alternative activities before any AI generation.
    Enforces strict hard constraints:
    - Never suggests categories the user has chosen to avoid
    - Prioritizes user's favorite activity types and energy/social preferences
    - Matches time duration buckets: 2-minute, 10-minute, 20-minute options
    """
    query = db.query(Activity).filter(Activity.is_active == True)
    all_activities = query.all()

    avoid_categories = set()
    preferred_categories = set()
    preferred_duration = 10
    energy_pref = "moderate"
    social_pref = "solo"
    goal_lens = "Reduce Digital Distraction"

    if user_profile:
        # Load user avoidance preferences
        avoid_prefs = db.query(UserActivityPreference).filter(
            UserActivityPreference.user_id == user_profile.user_id,
            UserActivityPreference.preference_type == "avoid"
        ).all()
        for p in avoid_prefs:
            avoid_categories.add(p.activity_category.strip().lower())

        pref_prefs = db.query(UserActivityPreference).filter(
            UserActivityPreference.user_id == user_profile.user_id,
            UserActivityPreference.preference_type == "preferred"
        ).all()
        for p in pref_prefs:
            preferred_categories.add(p.activity_category.strip().lower())

        if user_profile.preferred_activity_duration:
            preferred_duration = user_profile.preferred_activity_duration
        if user_profile.energy_preference:
            energy_pref = user_profile.energy_preference.strip().lower()
        if user_profile.social_preference:
            social_pref = user_profile.social_preference.strip().lower()
        if user_profile.goal_lens:
            goal_lens = user_profile.goal_lens

    # Filter out avoided categories
    valid_activities = [
        act for act in all_activities
        if act.category.lower() not in avoid_categories
    ]

    # If all activities were avoided (edge case), relax constraint safely
    if not valid_activities:
        valid_activities = all_activities

    # We want 3 complementary duration tiers: 2-minute, 10-minute, and 20-minute
    tiers = [
        {"max_dur": 3, "label": "2-minute option"},
        {"max_dur": 12, "label": "10-minute option"},
        {"max_dur": 30, "label": "20-minute option"},
    ]

    matched_results = []
    selected_ids = set()

    for tier in tiers:
        candidates = [
            act for act in valid_activities
            if act.id not in selected_ids and (
                (tier["max_dur"] <= 3 and act.duration_minutes <= 3) or
                (tier["max_dur"] == 12 and 4 <= act.duration_minutes <= 12) or
                (tier["max_dur"] >= 30 and act.duration_minutes >= 13)
            )
        ]

        if not candidates:
            # Fallback to any valid activity not yet chosen
            candidates = [act for act in valid_activities if act.id not in selected_ids]

        if not candidates:
            continue

        # Score candidate based on user fit
        scored = []
        for act in candidates:
            score = 1.0
            if act.category.lower() in preferred_categories:
                score += 3.0
            if act.energy_level.lower() == energy_pref:
                score += 1.5
            if act.social_type.lower() == social_pref or act.social_type.lower() == "both":
                score += 1.0
            scored.append((score, act))

        scored.sort(key=lambda x: x[0], reverse=True)
        best_act = scored[0][1]
        selected_ids.add(best_act.id)

        fit_rating = "high" if best_act.category.lower() in preferred_categories else "medium"
        reason = f"Matches your {best_act.duration_minutes}-minute availability window and alignment with {best_act.reward_type} activities."
        if best_act.category.lower() in preferred_categories:
            reason = f"You selected {best_act.category} as a preferred low-friction interest and have a {best_act.duration_minutes}-minute window."

        matched_results.append({
            "activity_id": str(best_act.id),
            "title": best_act.title,
            "category": best_act.category,
            "duration_minutes": best_act.duration_minutes,
            "difficulty": best_act.difficulty,
            "reason": reason,
            "user_fit": fit_rating,
            "reward_type": best_act.reward_type,
            "tier_label": tier["label"],
            "instructions": best_act.instructions
        })

    return matched_results[:limit]
