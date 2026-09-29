import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User
from backend.app.models.profile import UserProfile, UserInterest, UserActivityPreference
from backend.app.schemas.common import ApiResponse
from backend.app.schemas.user import UserResponse, UserProfileResponse, UserProfileUpdate, OnboardingRequest
from backend.app.services.activity_seed import seed_activities_if_empty

router = APIRouter()


@router.get("/me", response_model=ApiResponse[UserResponse])
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches the authenticated user profile and onboarding state"""
    profile = current_user.profile
    if not profile:
        profile = UserProfile(
            user_id=current_user.id,
            display_name=current_user.email.split("@")[0].capitalize(),
            onboarding_completed=False
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    # Format profile response
    user_data = {
        "id": current_user.id,
        "email": current_user.email,
        "created_at": current_user.created_at,
        "profile": {
            "id": profile.id,
            "user_id": profile.user_id,
            "display_name": profile.display_name,
            "timezone": profile.timezone,
            "onboarding_completed": profile.onboarding_completed,
            "preferred_activity_duration": profile.preferred_activity_duration,
            "preferred_activity_types": json.loads(profile.preferred_activity_types or "[]"),
            "goal_lens": profile.goal_lens,
            "reward_style": profile.reward_style,
            "energy_preference": profile.energy_preference,
            "social_preference": profile.social_preference,
            "typical_free_time": profile.typical_free_time,
            "high_risk_periods": json.loads(profile.high_risk_periods or "[]"),
            "created_at": profile.created_at,
            "updated_at": profile.updated_at
        }
    }
    return ApiResponse(success=True, data=user_data, message="User profile retrieved")


@router.put("/me", response_model=ApiResponse[UserProfileResponse])
def update_user_profile(
    updates: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates user profile settings"""
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    if updates.email is not None and updates.email.strip():
        new_email = updates.email.strip().lower()
        existing = db.query(User).filter(User.email == new_email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already in use by another account.")
        current_user.email = new_email

    if updates.display_name is not None:
        profile.display_name = updates.display_name.strip()
    if updates.timezone is not None:
        profile.timezone = updates.timezone
    if updates.preferred_activity_duration is not None:
        profile.preferred_activity_duration = updates.preferred_activity_duration

    if updates.preferred_activity_types is not None:
        profile.preferred_activity_types = json.dumps(updates.preferred_activity_types)
    if updates.goal_lens is not None:
        profile.goal_lens = updates.goal_lens
    if updates.reward_style is not None:
        profile.reward_style = updates.reward_style
    if updates.energy_preference is not None:
        profile.energy_preference = updates.energy_preference
    if updates.social_preference is not None:
        profile.social_preference = updates.social_preference
    if updates.typical_free_time is not None:
        profile.typical_free_time = updates.typical_free_time
    if updates.high_risk_periods is not None:
        profile.high_risk_periods = json.dumps(updates.high_risk_periods)

    db.commit()
    db.refresh(profile)

    res_data = {
        "id": profile.id,
        "user_id": profile.user_id,
        "display_name": profile.display_name,
        "timezone": profile.timezone,
        "onboarding_completed": profile.onboarding_completed,
        "preferred_activity_duration": profile.preferred_activity_duration,
        "preferred_activity_types": json.loads(profile.preferred_activity_types or "[]"),
        "goal_lens": profile.goal_lens,
        "reward_style": profile.reward_style,
        "energy_preference": profile.energy_preference,
        "social_preference": profile.social_preference,
        "typical_free_time": profile.typical_free_time,
        "high_risk_periods": json.loads(profile.high_risk_periods or "[]"),
        "created_at": profile.created_at,
        "updated_at": profile.updated_at
    }
    return ApiResponse(success=True, data=res_data, message="Profile updated successfully")


@router.post("/onboarding", response_model=ApiResponse[UserProfileResponse])
def complete_onboarding(
    payload: OnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Saves onboarding questionnaire answers, seeds default activity library if empty,
    and transitions user onboarding_completed flag to True.
    """
    seed_activities_if_empty(db)

    profile = current_user.profile
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    profile.display_name = payload.display_name or profile.display_name
    profile.onboarding_completed = True
    profile.typical_free_time = payload.typical_free_time
    profile.goal_lens = payload.main_personal_goal
    profile.reward_style = payload.preferred_reward_style
    profile.energy_preference = payload.creative_productive_relaxation
    profile.social_preference = payload.social_solo_preference
    profile.preferred_activity_types = json.dumps(payload.favorite_activities)
    profile.high_risk_periods = json.dumps(payload.high_risk_periods)

    # Parse duration in minutes from typical_free_time string
    try:
        dur_num = int("".join([c for c in payload.typical_free_time if c.isdigit()]))
        profile.preferred_activity_duration = max(2, min(60, dur_num))
    except (ValueError, TypeError):
        profile.preferred_activity_duration = 10

    # Clean old activity preferences and interests for this user
    db.query(UserInterest).filter(UserInterest.user_id == current_user.id).delete()
    db.query(UserActivityPreference).filter(UserActivityPreference.user_id == current_user.id).delete()

    # Record favorite interests
    for i, act in enumerate(payload.favorite_activities):
        db.add(UserInterest(user_id=current_user.id, category=act, priority=i+1))
        db.add(UserActivityPreference(user_id=current_user.id, activity_category=act, preference_type="preferred"))

    # Record avoided activities
    for act in payload.avoid_activities:
        db.add(UserActivityPreference(user_id=current_user.id, activity_category=act, preference_type="avoid"))

    db.commit()
    db.refresh(profile)

    res_data = {
        "id": profile.id,
        "user_id": profile.user_id,
        "display_name": profile.display_name,
        "timezone": profile.timezone,
        "onboarding_completed": profile.onboarding_completed,
        "preferred_activity_duration": profile.preferred_activity_duration,
        "preferred_activity_types": json.loads(profile.preferred_activity_types or "[]"),
        "goal_lens": profile.goal_lens,
        "reward_style": profile.reward_style,
        "energy_preference": profile.energy_preference,
        "social_preference": profile.social_preference,
        "typical_free_time": profile.typical_free_time,
        "high_risk_periods": json.loads(profile.high_risk_periods or "[]"),
        "created_at": profile.created_at,
        "updated_at": profile.updated_at
    }
    return ApiResponse(success=True, data=res_data, message="Onboarding completed successfully")
