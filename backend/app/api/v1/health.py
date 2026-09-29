import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.db.session import get_db
from backend.app.services.ai.kimi_client import kimi_client
from backend.app.schemas.common import ApiResponse

router = APIRouter()
start_time = time.time()


@router.get("/health", response_model=ApiResponse[dict])
def health_check(db: Session = Depends(get_db)):
    """
    Verifies overall backend health, database connectivity, and reports AI configuration status.
    Backend remains healthy even if AI provider is temporarily unavailable.
    """
    db_healthy = False
    db_error = None
    try:
        db.execute(text("SELECT 1"))
        db_healthy = True
    except Exception as e:
        db_error = str(e)

    ai_status = "configured" if kimi_client.is_configured else "fallback_active"

    data = {
        "status": "healthy" if db_healthy else "degraded",
        "database": {
            "connected": db_healthy,
            "error": db_error
        },
        "ai_service": {
            "status": ai_status,
            "provider": "Kimi K3 (Moonshot AI)",
            "model": kimi_client.model,
            "fallback_available": True
        },
        "uptime_seconds": round(time.time() - start_time, 1)
    }

    return ApiResponse(
        success=db_healthy,
        data=data,
        message="Backend health verified" if db_healthy else "Database degraded"
    )
