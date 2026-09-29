from typing import List
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User
from backend.app.models.goal import Goal, GoalProgress
from backend.app.models.usage import UsageSession
from backend.app.schemas.common import ApiResponse
from backend.app.schemas.goal import GoalCreate, GoalUpdate, GoalResponse, GoalProgressResponse

router = APIRouter()


@router.get("", response_model=ApiResponse[List[GoalResponse]])
def get_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all goals and computes latest baseline progress"""
    goals = db.query(Goal).filter(
        Goal.user_id == current_user.id
    ).order_by(Goal.created_at.desc()).all()

    result = []
    for g in goals:
        prog_records = [
            GoalProgressResponse(
                id=p.id,
                date=p.date,
                achieved=p.achieved,
                metric_value=p.metric_value
            )
            for p in g.progress_records
        ]
        result.append(GoalResponse(
            id=g.id,
            goal_lens=g.goal_lens,
            title=g.title,
            target_metric=g.target_metric,
            target_value=g.target_value,
            current_value=g.current_value,
            unit=g.unit,
            status=g.status,
            explanation=g.explanation,
            created_at=g.created_at,
            updated_at=g.updated_at,
            progress_records=prog_records
        ))

    return ApiResponse(success=True, data=result, message=f"Retrieved {len(result)} goals")


@router.post("", response_model=ApiResponse[GoalResponse])
def create_goal(
    payload: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a new self-regulation goal"""
    goal = Goal(
        user_id=current_user.id,
        goal_lens=payload.goal_lens,
        title=payload.title,
        target_metric=payload.target_metric,
        target_value=payload.target_value,
        current_value=0.0,
        unit=payload.unit,
        status="active",
        explanation=payload.explanation or f"Goal created to support {payload.goal_lens}."
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)

    return ApiResponse(
        success=True,
        data=GoalResponse(
            id=goal.id,
            goal_lens=goal.goal_lens,
            title=goal.title,
            target_metric=goal.target_metric,
            target_value=goal.target_value,
            current_value=goal.current_value,
            unit=goal.unit,
            status=goal.status,
            explanation=goal.explanation,
            created_at=goal.created_at,
            updated_at=goal.updated_at,
            progress_records=[]
        ),
        message="Goal created successfully"
    )


@router.put("/{id}", response_model=ApiResponse[GoalResponse])
def update_goal(
    id: UUID,
    payload: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates or toggles pause/resume on a goal"""
    goal = db.query(Goal).filter(
        Goal.id == id,
        Goal.user_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    if payload.title is not None:
        goal.title = payload.title
    if payload.target_value is not None:
        goal.target_value = payload.target_value
    if payload.status is not None:
        goal.status = payload.status
    if payload.explanation is not None:
        goal.explanation = payload.explanation

    db.commit()
    db.refresh(goal)

    prog_records = [
        GoalProgressResponse(
            id=p.id,
            date=p.date,
            achieved=p.achieved,
            metric_value=p.metric_value
        )
        for p in goal.progress_records
    ]

    return ApiResponse(
        success=True,
        data=GoalResponse(
            id=goal.id,
            goal_lens=goal.goal_lens,
            title=goal.title,
            target_metric=goal.target_metric,
            target_value=goal.target_value,
            current_value=goal.current_value,
            unit=goal.unit,
            status=goal.status,
            explanation=goal.explanation,
            created_at=goal.created_at,
            updated_at=goal.updated_at,
            progress_records=prog_records
        ),
        message="Goal updated"
    )
