import json
from uuid import UUID
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User
from backend.app.models.habit import HabitLoop
from backend.app.models.swap import PersonalSwapSuggestion, PersonalSwapCompletion
from backend.app.schemas.common import ApiResponse
from backend.app.schemas.swap import (
    PersonalSwapSuggestionResponse,
    PersonalSwapGenerateRequest,
    PersonalSwapActionRequest
)
from backend.app.services.task_engine import match_personalized_activities
from backend.app.services.ai.kimi_client import kimi_client
from backend.app.services.activity_seed import seed_activities_if_empty

router = APIRouter()


@router.get("", response_model=ApiResponse[List[PersonalSwapSuggestionResponse]])
def get_personal_swaps(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns active or recent Personal Swap suggestions for the user.
    If none exist, seeds activities and generates a fresh set.
    """
    seed_activities_if_empty(db)
    suggestions = db.query(PersonalSwapSuggestion).filter(
        PersonalSwapSuggestion.user_id == current_user.id
    ).order_by(PersonalSwapSuggestion.created_at.desc()).limit(6).all()

    if not suggestions:
        # Generate initial suggestions deterministically
        return generate_personal_swaps(PersonalSwapGenerateRequest(), current_user, db)

    data = [
        PersonalSwapSuggestionResponse(
            id=s.id,
            habit_loop_id=s.habit_loop_id,
            activity_id=s.activity_id,
            title=s.title,
            category=s.category,
            duration_minutes=s.duration_minutes,
            difficulty=s.difficulty,
            reason=s.reason,
            user_fit=s.user_fit,
            reward_type=s.reward_type,
            status=s.status,
            created_at=s.created_at
        )
        for s in suggestions
    ]
    return ApiResponse(success=True, data=data, message=f"Retrieved {len(data)} suggestions")


@router.post("/generate", response_model=ApiResponse[List[PersonalSwapSuggestionResponse]])
def generate_personal_swaps(
    payload: PersonalSwapGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates 3 alternative activities (2-minute, 10-minute, 20-minute)
    using deterministic personalization rules based on user onboarding preferences,
    followed by AI phrasing.
    """
    seed_activities_if_empty(db)

    # Find relevant habit loop
    habit_loop = None
    if payload.habit_loop_id:
        habit_loop = db.query(HabitLoop).filter(
            HabitLoop.id == payload.habit_loop_id,
            HabitLoop.user_id == current_user.id
        ).first()
    if not habit_loop:
        habit_loop = db.query(HabitLoop).filter(
            HabitLoop.user_id == current_user.id,
            HabitLoop.status == "active"
        ).order_by(HabitLoop.total_minutes_impact.desc()).first()

    habit_dict = None
    if habit_loop:
        habit_dict = {
            "app_name": habit_loop.app_name,
            "trigger_description": habit_loop.trigger_description,
            "time_window_start": habit_loop.time_window_start,
            "time_window_end": habit_loop.time_window_end,
            "average_duration_minutes": habit_loop.average_duration_minutes
        }

    # Deterministic matching FIRST
    matched = match_personalized_activities(
        db=db,
        user_profile=current_user.profile,
        habit_loop=habit_dict,
        available_minutes=payload.available_minutes,
        limit=3
    )

    created_suggestions = []
    for item in matched:
        act_id = UUID(item["activity_id"]) if item.get("activity_id") else None
        hl_id = habit_loop.id if habit_loop else None

        suggestion = PersonalSwapSuggestion(
            user_id=current_user.id,
            habit_loop_id=hl_id,
            activity_id=act_id,
            title=item["title"],
            category=item["category"],
            duration_minutes=item["duration_minutes"],
            difficulty=item["difficulty"],
            reason=item["reason"],
            user_fit=item["user_fit"],
            reward_type=item["reward_type"],
            status="suggested"
        )
        db.add(suggestion)
        db.flush()
        created_suggestions.append(suggestion)

    db.commit()

    data = [
        PersonalSwapSuggestionResponse(
            id=s.id,
            habit_loop_id=s.habit_loop_id,
            activity_id=s.activity_id,
            title=s.title,
            category=s.category,
            duration_minutes=s.duration_minutes,
            difficulty=s.difficulty,
            reason=s.reason,
            user_fit=s.user_fit,
            reward_type=s.reward_type,
            status=s.status,
            created_at=s.created_at
        )
        for s in created_suggestions
    ]
    return ApiResponse(success=True, data=data, message="Personal Swap alternatives generated")


@router.post("/{id}/start", response_model=ApiResponse[PersonalSwapSuggestionResponse])
def start_personal_swap(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marks a Personal Swap activity as started"""
    suggestion = db.query(PersonalSwapSuggestion).filter(
        PersonalSwapSuggestion.id == id,
        PersonalSwapSuggestion.user_id == current_user.id
    ).first()

    if not suggestion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Swap suggestion not found")

    suggestion.status = "started"
    db.commit()
    db.refresh(suggestion)

    return ApiResponse(
        success=True,
        data=PersonalSwapSuggestionResponse(
            id=suggestion.id,
            habit_loop_id=suggestion.habit_loop_id,
            activity_id=suggestion.activity_id,
            title=suggestion.title,
            category=suggestion.category,
            duration_minutes=suggestion.duration_minutes,
            difficulty=suggestion.difficulty,
            reason=suggestion.reason,
            user_fit=suggestion.user_fit,
            reward_type=suggestion.reward_type,
            status=suggestion.status,
            created_at=suggestion.created_at
        ),
        message=f"Started '{suggestion.title}'. Take your time to enjoy the activity."
    )


@router.post("/{id}/complete", response_model=ApiResponse[dict])
def complete_personal_swap(
    id: UUID,
    payload: PersonalSwapActionRequest = PersonalSwapActionRequest(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Records completion of an alternative activity"""
    suggestion = db.query(PersonalSwapSuggestion).filter(
        PersonalSwapSuggestion.id == id,
        PersonalSwapSuggestion.user_id == current_user.id
    ).first()

    if not suggestion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Swap suggestion not found")

    suggestion.status = "completed"

    completion = PersonalSwapCompletion(
        suggestion_id=suggestion.id,
        user_id=current_user.id,
        completed_at=datetime.now(timezone.utc),
        feedback_rating=payload.rating or 5,
        reflection_notes=payload.notes or "Interrupted loop with chosen alternative."
    )
    db.add(completion)

    # If linked to a habit loop, record an interruption state
    if suggestion.habit_loop:
        suggestion.habit_loop.status = "interrupted"

    db.commit()

    return ApiResponse(
        success=True,
        data={
            "suggestion_id": str(suggestion.id),
            "status": "completed",
            "message": "Nice. You interrupted the loop with an activity you chose."
        },
        message="Nice. You interrupted the loop with an activity you chose."
    )


@router.post("/{id}/skip", response_model=ApiResponse[dict])
def skip_personal_swap(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marks a Personal Swap suggestion as skipped without negative judgment"""
    suggestion = db.query(PersonalSwapSuggestion).filter(
        PersonalSwapSuggestion.id == id,
        PersonalSwapSuggestion.user_id == current_user.id
    ).first()

    if not suggestion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Swap suggestion not found")

    suggestion.status = "skipped"
    db.commit()

    return ApiResponse(
        success=True,
        data={"suggestion_id": str(suggestion.id), "status": "skipped"},
        message="Alternative skipped. You can explore other options anytime."
    )
