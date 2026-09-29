from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User
from backend.app.models.usage import Notification
from backend.app.schemas.common import ApiResponse
from backend.app.schemas.usage import NotificationResponse

router = APIRouter()


@router.get("", response_model=ApiResponse[List[NotificationResponse]])
def get_user_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves recorded notifications for the current user"""
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.timestamp.desc()).limit(100).all()

    return ApiResponse(
        success=True,
        data=[
            NotificationResponse(
                id=n.id,
                app_name=n.app_name,
                timestamp=n.timestamp,
                title=n.title,
                content_preview=n.content_preview
            )
            for n in notifs
        ],
        message="Notifications retrieved"
    )
