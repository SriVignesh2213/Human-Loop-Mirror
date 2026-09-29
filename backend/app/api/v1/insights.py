import json
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User
from backend.app.models.insight import Insight
from backend.app.schemas.common import ApiResponse
from backend.app.schemas.insight import InsightResponse

router = APIRouter()


def _clean_evidence(raw_ev) -> List[str]:
    if not raw_ev:
        return []
    try:
        loaded = json.loads(raw_ev) if isinstance(raw_ev, str) else raw_ev
    except Exception:
        return [str(raw_ev)]
    if not isinstance(loaded, list):
        loaded = [loaded]
    return [
        item["label"] if isinstance(item, dict) and "label" in item
        else item.get("text", str(item)) if isinstance(item, dict)
        else str(item)
        for item in loaded
    ]


@router.get("", response_model=ApiResponse[List[InsightResponse]])
def get_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all generated explainable AI insights for the user"""
    insights = db.query(Insight).filter(
        Insight.user_id == current_user.id
    ).order_by(Insight.created_at.desc()).all()

    data = [
        InsightResponse(
            id=i.id,
            type=i.insight_type,
            title=i.title,
            observation=i.observation,
            evidence=_clean_evidence(i.evidence),
            why_it_matters=i.why_it_matters,
            recommendation=i.recommendation,
            confidence=i.confidence,
            source=i.source,
            created_at=i.created_at,
            habit_loop_id=i.habit_loop_id
        )
        for i in insights
    ]

    return ApiResponse(
        success=True,
        data=data,
        message=f"Retrieved {len(data)} insights"
    )


@router.get("/{id}", response_model=ApiResponse[InsightResponse])
def get_insight_by_id(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves a specific insight by ID"""
    i = db.query(Insight).filter(
        Insight.id == id,
        Insight.user_id == current_user.id
    ).first()

    if not i:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insight not found")

    return ApiResponse(
        success=True,
        data=InsightResponse(
            id=i.id,
            type=i.insight_type,
            title=i.title,
            observation=i.observation,
            evidence=_clean_evidence(i.evidence),
            why_it_matters=i.why_it_matters,
            recommendation=i.recommendation,
            confidence=i.confidence,
            source=i.source,
            created_at=i.created_at,
            habit_loop_id=i.habit_loop_id
        ),
        message="Insight retrieved"
    )


@router.get("/{id}/evidence", response_model=ApiResponse[List[str]])
def get_insight_evidence(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves evidence list supporting this insight"""
    i = db.query(Insight).filter(
        Insight.id == id,
        Insight.user_id == current_user.id
    ).first()

    if not i:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insight not found")

    evidence_list = _clean_evidence(i.evidence)
    return ApiResponse(
        success=True,
        data=evidence_list,
        message="Insight evidence retrieved"
    )
