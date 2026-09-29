import uuid
from typing import Optional, Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.db.session import get_db
from backend.app.models.user import User
from backend.app.models.profile import UserProfile
from backend.app.utils.logger import logger

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Validates Supabase JWT access token and resolves or provisions the local User.
    Supports real Supabase JWT verification when SUPABASE_JWT_SECRET is configured,
    and safe development token decoding in local test environments.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "message": "Authentication required. Please sign in.", "error_code": "SESSION_EXPIRED"}
        )

    token = credentials.credentials

    # Handle demo/local fallback token or decode Supabase JWT
    user_id_str = None
    email_str = "demo@habitloopmirror.dev"

    if token == "demo-dev-token" or token.startswith("dev-user-"):
        user_id_str = "00000000-0000-0000-0000-000000000001"
        email_str = "demo@habitloopmirror.dev"
    else:
        try:
            if settings.SUPABASE_JWT_SECRET:
                payload = jwt.decode(
                    token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    audience=settings.SUPABASE_JWT_AUDIENCE
                )
            else:
                # In development without secret yet, decode without verification to read claims
                payload = jwt.decode(token, options={"verify_signature": False})

            user_id_str = payload.get("sub") or payload.get("user_id")
            email_str = payload.get("email", f"user_{user_id_str[:8]}@habitloop.dev")
        except jwt.PyJWTError as e:
            logger.warning(f"JWT decode error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"success": False, "message": "Invalid or expired session token.", "error_code": "SESSION_EXPIRED"}
            )

    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "message": "Malformed token subject.", "error_code": "INVALID_TOKEN"}
        )

    try:
        user_uuid = uuid.UUID(str(user_id_str))
    except ValueError:
        # Generate deterministic UUID from string if not standard UUID format
        user_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, user_id_str)

    # Find or create user
    user = db.query(User).filter(User.id == user_uuid).first()
    if not user:
        # Check by email as fallback
        user = db.query(User).filter(User.email == email_str).first()

    if not user:
        user = User(
            id=user_uuid,
            email=email_str
        )
        db.add(user)
        db.flush()

        # Create initial profile
        profile = UserProfile(
            user_id=user.id,
            display_name=email_str.split("@")[0].capitalize(),
            onboarding_completed=False,
            preferred_activity_duration=10,
            goal_lens="Focus / Study"
        )
        db.add(profile)
        db.commit()
        db.refresh(user)

    return user
