from typing import List
from uuid import UUID
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User
from backend.app.models.usage import UsageSession
from backend.app.models.reflection import Reflection
from backend.app.schemas.common import ApiResponse
from backend.app.schemas.reflection import ReflectionCreate, ReflectionResponse, ReflectionStatsResponse

router = APIRouter()


@router.get("", response_model=ApiResponse[List[ReflectionResponse]])
def get_reflections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all user intentionality reflections"""
    refls = db.query(Reflection).filter(
        Reflection.user_id == current_user.id
    ).order_by(Reflection.created_at.desc()).all()

    data = [
        ReflectionResponse(
            id=r.id,
            user_id=r.user_id,
            session_id=r.session_id,
            intentionality_label=r.intentionality_label,
            notes=r.notes,
            prompt_answered=r.prompt_answered,
            created_at=r.created_at
        )
        for r in refls
    ]
    return ApiResponse(success=True, data=data, message=f"Retrieved {len(data)} reflections")


@router.get("/stats", response_model=ApiResponse[ReflectionStatsResponse])
def get_reflection_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Calculates aggregate composition of reflections across intentionality labels"""
    refls = db.query(Reflection).filter(Reflection.user_id == current_user.id).all()
    total = len(refls)

    breakdown = {"Planned": 0, "Necessary": 0, "Relaxation": 0, "Unplanned": 0}
    for r in refls:
        if r.intentionality_label in breakdown:
            breakdown[r.intentionality_label] += 1

    percentages = {
        k: round((v / total * 100.0), 1) if total > 0 else 0.0
        for k, v in breakdown.items()
    }

    return ApiResponse(
        success=True,
        data=ReflectionStatsResponse(
            total_reflections=total,
            breakdown=breakdown,
            percentages=percentages
        ),
        message="Reflection statistics retrieved"
    )


@router.post("", response_model=ApiResponse[ReflectionResponse])
def create_reflection(
    payload: ReflectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Saves a user reflection on session intentionality"""
    if payload.session_id:
        session = db.query(UsageSession).filter(
            UsageSession.id == payload.session_id,
            UsageSession.user_id == current_user.id
        ).first()
        if session:
            session.reflection_label = payload.intentionality_label

    reflection = Reflection(
        user_id=current_user.id,
        session_id=payload.session_id,
        intentionality_label=payload.intentionality_label,
        notes=payload.notes,
        prompt_answered=payload.prompt_answered
    )
    db.add(reflection)
    db.commit()
    db.refresh(reflection)

    return ApiResponse(
        success=True,
        data=ReflectionResponse(
            id=reflection.id,
            user_id=reflection.user_id,
            session_id=reflection.session_id,
            intentionality_label=reflection.intentionality_label,
            notes=reflection.notes,
            prompt_answered=reflection.prompt_answered,
            created_at=reflection.created_at
        ),
        message="Reflection saved successfully"
    )


@router.put("/{id}", response_model=ApiResponse[ReflectionResponse])
def update_reflection(
    id: UUID,
    payload: ReflectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates an existing reflection"""
    refl = db.query(Reflection).filter(
        Reflection.id == id,
        Reflection.user_id == current_user.id
    ).first()

    if not refl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reflection not found")

    refl.intentionality_label = payload.intentionality_label
    refl.notes = payload.notes
    db.commit()
    db.refresh(refl)

    return ApiResponse(
        success=True,
        data=ReflectionResponse(
            id=refl.id,
            user_id=refl.user_id,
            session_id=refl.session_id,
            intentionality_label=refl.intentionality_label,
            notes=refl.notes,
            prompt_answered=refl.prompt_answered,
            created_at=refl.created_at
        ),
        message="Reflection updated"
    )
