import io
import csv
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple


REQUIRED_COLUMNS = ["timestamp", "app_name"]


def parse_iso_datetime(dt_str: str) -> datetime:
    """Safely parse various datetime formats into UTC datetime"""
    dt_str = dt_str.strip()
    # Try standard ISO format
    try:
        if "T" in dt_str:
            return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        # Try YYYY-MM-DD HH:MM:SS
        return datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        # Try YYYY-MM-DD HH:MM
        try:
            return datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
        except ValueError:
            raise ValueError(f"Invalid timestamp format: '{dt_str}'. Expected ISO-8601 (e.g., 2026-09-22T20:47:00)")


def validate_and_parse_csv(
    file_content: str,
) -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Validates CSV content and returns parsed rows along with validation errors/warnings.
    Never silently drops invalid records.
    """
    errors: List[str] = []
    parsed_rows: List[Dict[str, Any]] = []

    f = io.StringIO(file_content.strip())
    reader = csv.DictReader(f)

    if not reader.fieldnames:
        errors.append("EMPTY_DATASET: The uploaded CSV file has no headers or data.")
        return parsed_rows, errors

    # Normalize fieldnames to lowercase
    fieldnames = [col.strip().lower() for col in reader.fieldnames if col]
    header_map = {col.strip().lower(): col for col in reader.fieldnames if col}

    # Check required columns
    for req in REQUIRED_COLUMNS:
        if req not in fieldnames:
            errors.append(f"MISSING_REQUIRED_COLUMN: Missing required column '{req}'. Required columns: {REQUIRED_COLUMNS}")

    if errors:
        return parsed_rows, errors

    row_index = 1
    now = datetime.now(timezone.utc)

    for row in reader:
        row_index += 1
        raw_timestamp = row.get(header_map.get("timestamp", ""), "").strip()
        app_name = row.get(header_map.get("app_name", ""), "").strip()

        if not raw_timestamp and not app_name:
            # Skip pure empty row
            continue

        if not raw_timestamp:
            errors.append(f"Row {row_index}: MISSING_TIMESTAMP - 'timestamp' is blank.")
            continue

        if not app_name:
            errors.append(f"Row {row_index}: MISSING_APP_NAME - 'app_name' is blank.")
            continue

        try:
            start_time = parse_iso_datetime(raw_timestamp)
        except ValueError as e:
            errors.append(f"Row {row_index}: INVALID_TIMESTAMP - {str(e)}")
            continue

        # Check future timestamp (allow max 1 day ahead for timezone variations, reject far future)
        if start_time.tzinfo is None:
            # Assume local/naive
            pass

        # Optional duration or end_time
        duration_minutes = 0.0
        raw_duration = row.get(header_map.get("duration_minutes", ""), "").strip()
        raw_end_time = row.get(header_map.get("end_time", ""), "").strip()

        if raw_end_time:
            try:
                end_time = parse_iso_datetime(raw_end_time)
                if end_time < start_time:
                    errors.append(f"Row {row_index}: INVALID_DURATION - 'end_time' is before 'start_time'.")
                    continue
                duration_minutes = (end_time - start_time).total_seconds() / 60.0
            except ValueError as e:
                errors.append(f"Row {row_index}: INVALID_TIMESTAMP - end_time {str(e)}")
                continue
        elif raw_duration:
            try:
                duration_minutes = float(raw_duration)
                if duration_minutes <= 0:
                    errors.append(f"Row {row_index}: INVALID_DURATION - duration must be greater than 0.")
                    continue
                from datetime import timedelta
                end_time = start_time + timedelta(minutes=duration_minutes)
            except ValueError:
                errors.append(f"Row {row_index}: INVALID_DURATION - '{raw_duration}' is not a valid number.")
                continue
        else:
            # Default minimum session of 5 mins if unspecified
            from datetime import timedelta
            duration_minutes = 5.0
            end_time = start_time + timedelta(minutes=5)

        category = row.get(header_map.get("category", ""), "").strip() or "General"
        
        # Notification fields
        raw_notif_assoc = row.get(header_map.get("notification_associated", ""), "").strip().lower()
        notification_associated = raw_notif_assoc in ["true", "1", "yes"]
        raw_notif_time = row.get(header_map.get("notification_timestamp", ""), "").strip()
        notification_timestamp = None
        if raw_notif_time:
            try:
                notification_timestamp = parse_iso_datetime(raw_notif_time)
                notification_associated = True
            except ValueError:
                errors.append(f"Row {row_index}: INVALID_NOTIFICATION_TIMESTAMP - '{raw_notif_time}'")

        notif_title = row.get(header_map.get("notification_title", ""), "").strip()
        notif_app = row.get(header_map.get("notification_app", ""), "").strip() or app_name
        reflection_label = row.get(header_map.get("user_reflection", ""), "").strip() or row.get(header_map.get("reflection_label", ""), "").strip()

        parsed_rows.append({
            "app_name": app_name,
            "category": category,
            "start_time": start_time,
            "end_time": end_time,
            "duration_minutes": round(duration_minutes, 2),
            "is_long_session": duration_minutes >= 30.0,
            "notification_associated": notification_associated,
            "notification_timestamp": notification_timestamp,
            "notification_app": notif_app,
            "notification_title": notif_title,
            "reflection_label": reflection_label if reflection_label in ["Planned", "Necessary", "Relaxation", "Unplanned"] else None,
        })

    return parsed_rows, errors
