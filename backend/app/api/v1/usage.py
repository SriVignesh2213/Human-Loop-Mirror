from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User
from backend.app.models.usage import Application, UsageSession, Notification
from backend.app.schemas.common import ApiResponse
from backend.app.schemas.usage import ManualUsageRequest, UsageSessionResponse, CsvImportResult
from backend.app.utils.csv_validator import validate_and_parse_csv

router = APIRouter()


@router.post("/import", response_model=ApiResponse[CsvImportResult])
async def import_usage_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validates and imports usage data from a CSV file.
    Validates required columns, ISO timestamps, non-negative durations,
    and associates notifications within 3 minutes of sessions.
    Prevents duplicate entries.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Only CSV files are supported.", "error_code": "INVALID_FILE"}
        )

    content_bytes = await file.read()
    try:
        content_str = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        content_str = content_bytes.decode("latin-1")

    parsed_rows, validation_errors = validate_and_parse_csv(content_str)

    if validation_errors and not parsed_rows:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": f"CSV validation failed: {'; '.join(validation_errors[:5])}",
                "error_code": "INVALID_CSV_FORMAT",
                "validation_errors": validation_errors
            }
        )

    # Get existing applications or create new
    app_cache = {app.name.lower(): app for app in db.query(Application).all()}

    # Check for existing sessions to avoid duplicate imports
    existing_sessions = db.query(UsageSession.start_time, UsageSession.app_name).filter(
        UsageSession.user_id == current_user.id
    ).all()
    existing_set = {(st.isoformat(), name.lower()) for st, name in existing_sessions}

    imported_sessions_count = 0
    imported_notifs_count = 0
    skipped_count = 0

    for row in parsed_rows:
        st_iso = row["start_time"].isoformat()
        app_name_clean = row["app_name"].strip()
        app_key = app_name_clean.lower()

        # Check duplicate
        if (st_iso, app_key) in existing_set:
            skipped_count += 1
            continue

        # Application resolution
        if app_key not in app_cache:
            new_app = Application(
                name=app_name_clean,
                category=row.get("category", "General")
            )
            db.add(new_app)
            db.flush()
            app_cache[app_key] = new_app

        app_obj = app_cache[app_key]

        # Notification resolution
        notif_id = None
        if row.get("notification_associated") and row.get("notification_timestamp"):
            notif = Notification(
                user_id=current_user.id,
                app_id=app_obj.id,
                app_name=app_name_clean,
                timestamp=row["notification_timestamp"],
                title=row.get("notification_title") or f"{app_name_clean} Alert",
                content_preview=row.get("notification_title") or "New notification"
            )
            db.add(notif)
            db.flush()
            notif_id = notif.id
            imported_notifs_count += 1

        # Session creation
        session = UsageSession(
            user_id=current_user.id,
            app_id=app_obj.id,
            app_name=app_name_clean,
            start_time=row["start_time"],
            end_time=row["end_time"],
            duration_minutes=row["duration_minutes"],
            is_long_session=row["is_long_session"],
            notification_associated=row["notification_associated"],
            notification_id=notif_id,
            reflection_label=row.get("reflection_label")
        )
        db.add(session)
        existing_set.add((st_iso, app_key))
        imported_sessions_count += 1

    db.commit()

    result = CsvImportResult(
        total_records=len(parsed_rows),
        imported_sessions=imported_sessions_count,
        imported_notifications=imported_notifs_count,
        skipped_duplicates=skipped_count,
        validation_warnings=validation_errors[:10]
    )

    return ApiResponse(
        success=True,
        data=result,
        message=f"Successfully imported {imported_sessions_count} sessions ({skipped_count} skipped duplicates)."
    )


@router.post("/manual", response_model=ApiResponse[UsageSessionResponse])
def add_manual_session(
    payload: ManualUsageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allows manual entry of a usage session"""
    if payload.end_time <= payload.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "End time must be after start time.", "error_code": "INVALID_DURATION"}
        )

    duration_minutes = round((payload.end_time - payload.start_time).total_seconds() / 60.0, 2)
    is_long = duration_minutes >= 30.0

    app_name_clean = payload.app_name.strip()
    app = db.query(Application).filter(Application.name.ilike(app_name_clean)).first()
    if not app:
        app = Application(name=app_name_clean, category=payload.category or "General")
        db.add(app)
        db.flush()

    notif_id = None
    if payload.notification_associated:
        notif = Notification(
            user_id=current_user.id,
            app_id=app.id,
            app_name=app_name_clean,
            timestamp=payload.start_time,
            title=payload.notification_title or f"{app_name_clean} Alert",
            content_preview="Notification trigger"
        )
        db.add(notif)
        db.flush()
        notif_id = notif.id

    session = UsageSession(
        user_id=current_user.id,
        app_id=app.id,
        app_name=app_name_clean,
        start_time=payload.start_time,
        end_time=payload.end_time,
        duration_minutes=duration_minutes,
        is_long_session=is_long,
        notification_associated=payload.notification_associated,
        notification_id=notif_id,
        reflection_label=payload.reflection_label
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return ApiResponse(
        success=True,
        data=session,
        message="Manual usage session recorded"
    )
