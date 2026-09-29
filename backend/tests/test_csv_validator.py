from backend.app.utils.csv_validator import validate_and_parse_csv


def test_valid_csv_parsing():
    valid_csv = """timestamp,end_time,duration_minutes,app_name,category,notification_associated,notification_timestamp,notification_app,notification_title,user_reflection
2026-09-22T20:47:00,2026-09-22T21:21:00,34,Instagram,Social,true,2026-09-22T20:45:10,Instagram,Sarah sent a reel,Unplanned"""
    rows, errors = validate_and_parse_csv(valid_csv)
    assert len(errors) == 0
    assert len(rows) == 1
    assert rows[0]["app_name"] == "Instagram"
    assert rows[0]["duration_minutes"] == 34.0
    assert rows[0]["is_long_session"] is True
    assert rows[0]["notification_associated"] is True
    assert rows[0]["reflection_label"] == "Unplanned"


def test_missing_required_column():
    bad_csv = """end_time,duration_minutes,category\n2026-09-22T21:21:00,34,Social"""
    rows, errors = validate_and_parse_csv(bad_csv)
    assert len(errors) > 0
    assert any("MISSING_REQUIRED_COLUMN" in err for err in errors)


def test_invalid_duration_order():
    bad_csv = """timestamp,end_time,app_name\n2026-09-22T21:00:00,2026-09-22T20:00:00,Slack"""
    rows, errors = validate_and_parse_csv(bad_csv)
    assert len(errors) > 0
    assert any("INVALID_DURATION" in err for err in errors)


def test_empty_dataset():
    empty_csv = ""
    rows, errors = validate_and_parse_csv(empty_csv)
    assert len(errors) > 0
    assert any("EMPTY_DATASET" in err for err in errors)
