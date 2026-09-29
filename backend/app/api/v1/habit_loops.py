from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User
from backend.app.models.habit import HabitLoop, HabitLoopEvidence
from backend.app.schemas.common import ApiResponse
from backend.app.schemas.habit import HabitLoopResponse, HabitLoopEvidenceResponse

router = APIRouter()


@router.get("", response_model=ApiResponse[List[HabitLoopResponse]])
def get_habit_loops(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all detected habit loops for the current user"""
    loops = db.query(HabitLoop).filter(
        HabitLoop.user_id == current_user.id
    ).order_by(HabitLoop.total_minutes_impact.desc()).all()

    result = []
    for hl in loops:
        ev_items = [
            HabitLoopEvidenceResponse(
                id=ev.id,
                session_id=ev.session_id,
                session_timestamp=ev.session_timestamp,
                session_duration_minutes=ev.session_duration_minutes,
                notification_timestamp=ev.notification_timestamp,
                notification_title=ev.notification_title,
                latency_minutes=ev.latency_minutes
            )
            for ev in hl.evidence_items
        ]
        result.append(
            HabitLoopResponse(
                id=hl.id,
                app_name=hl.app_name,
                trigger_description=hl.trigger_description,
                action_description=hl.action_description,
                time_window_start=hl.time_window_start,
                time_window_end=hl.time_window_end,
                occurrences_count=hl.occurrences_count,
                total_days_analyzed=hl.total_days_analyzed,
                average_duration_minutes=hl.average_duration_minutes,
                total_minutes_impact=hl.total_minutes_impact,
                confidence=hl.confidence,
                status=hl.status,
                recommendation=hl.recommendation,
                last_detected_at=hl.last_detected_at,
                created_at=hl.created_at,
                evidence_items=ev_items
            )
        )

    return ApiResponse(
        success=True,
        data=result,
        message=f"Found {len(result)} habit loops"
    )


@router.get("/{id}", response_model=ApiResponse[HabitLoopResponse])
def get_habit_loop_by_id(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves details of a specific habit loop"""
    hl = db.query(HabitLoop).filter(
        HabitLoop.id == id,
        HabitLoop.user_id == current_user.id
    ).first()

    if not hl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit loop not found")

    ev_items = [
        HabitLoopEvidenceResponse(
            id=ev.id,
            session_id=ev.session_id,
            session_timestamp=ev.session_timestamp,
            session_duration_minutes=ev.session_duration_minutes,
            notification_timestamp=ev.notification_timestamp,
            notification_title=ev.notification_title,
            latency_minutes=ev.latency_minutes
        )
        for ev in hl.evidence_items
    ]

    return ApiResponse(
        success=True,
        data=HabitLoopResponse(
            id=hl.id,
            app_name=hl.app_name,
            trigger_description=hl.trigger_description,
            action_description=hl.action_description,
            time_window_start=hl.time_window_start,
            time_window_end=hl.time_window_end,
            occurrences_count=hl.occurrences_count,
            total_days_analyzed=hl.total_days_analyzed,
            average_duration_minutes=hl.average_duration_minutes,
            total_minutes_impact=hl.total_minutes_impact,
            confidence=hl.confidence,
            status=hl.status,
            recommendation=hl.recommendation,
            last_detected_at=hl.last_detected_at,
            created_at=hl.created_at,
            evidence_items=ev_items
        ),
        message="Habit loop retrieved"
    )


@router.get("/{id}/evidence", response_model=ApiResponse[List[HabitLoopEvidenceResponse]])
def get_habit_loop_evidence(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves underlying evidence timestamps and sessions for a habit loop"""
    hl = db.query(HabitLoop).filter(
        HabitLoop.id == id,
        HabitLoop.user_id == current_user.id
    ).first()

    if not hl:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit loop not found")

    ev_items = [
        HabitLoopEvidenceResponse(
            id=ev.id,
            session_id=ev.session_id,
            session_timestamp=ev.session_timestamp,
            session_duration_minutes=ev.session_duration_minutes,
            notification_timestamp=ev.notification_timestamp,
            notification_title=ev.notification_title,
            latency_minutes=ev.latency_minutes
        )
        for ev in hl.evidence_items
    ]

    return ApiResponse(
        success=True,
        data=ev_items,
        message=f"Retrieved {len(ev_items)} evidence entries"
    )
