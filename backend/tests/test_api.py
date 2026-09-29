import io


def test_unauthorized_access_rejected(client):
    response = client.get("/api/v1/dashboard")
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error_code"] == "SESSION_EXPIRED"


def test_onboarding_and_profile_flow(client, auth_headers):
    # Complete onboarding
    payload = {
        "display_name": "Explorer",
        "favorite_activities": ["coding", "drawing"],
        "typical_free_time": "10 minutes",
        "preferred_activity_type": "creative",
        "main_personal_goal": "Focus / Study",
        "preferred_reward_style": "creative",
        "avoid_activities": ["gaming"],
        "difficulty_preference": "easy",
        "social_solo_preference": "solo",
        "creative_productive_relaxation": "creative",
        "high_risk_periods": ["evening"]
    }
    res = client.post("/api/v1/users/onboarding", json=payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["onboarding_completed"] is True
    assert data["data"]["display_name"] == "Explorer"

    # Get current user profile
    res_me = client.get("/api/v1/users/me", headers=auth_headers)
    assert res_me.status_code == 200
    assert res_me.json()["data"]["profile"]["onboarding_completed"] is True


def test_manual_session_and_reflection(client, auth_headers):
    session_data = {
        "app_name": "Instagram",
        "category": "Social",
        "start_time": "2026-09-22T20:47:00",
        "end_time": "2026-09-22T21:21:00",
        "notification_associated": True,
        "notification_title": "Alex shared a reel"
    }
    res = client.post("/api/v1/usage/manual", json=session_data, headers=auth_headers)
    assert res.status_code == 200
    created_session = res.json()["data"]
    assert created_session["app_name"] == "Instagram"
    assert created_session["duration_minutes"] == 34.0

    # Submit reflection
    refl_data = {
        "session_id": created_session["id"],
        "intentionality_label": "Unplanned",
        "notes": "Clicked automatically upon notification alert"
    }
    res_refl = client.post("/api/v1/reflections", json=refl_data, headers=auth_headers)
    assert res_refl.status_code == 200
    assert res_refl.json()["data"]["intentionality_label"] == "Unplanned"

    # Check stats
    res_stats = client.get("/api/v1/reflections/stats", headers=auth_headers)
    assert res_stats.status_code == 200
    assert res_stats.json()["data"]["total_reflections"] >= 1


def test_personal_swap_lifecycle(client, auth_headers):
    # Generate swap alternatives
    res_gen = client.post("/api/v1/personal-swap/generate", json={}, headers=auth_headers)
    assert res_gen.status_code == 200
    suggestions = res_gen.json()["data"]
    assert len(suggestions) > 0
    first_id = suggestions[0]["id"]

    # Start swap
    res_start = client.post(f"/api/v1/personal-swap/{first_id}/start", headers=auth_headers)
    assert res_start.status_code == 200
    assert res_start.json()["data"]["status"] == "started"

    # Complete swap
    res_comp = client.post(f"/api/v1/personal-swap/{first_id}/complete", json={"rating": 5}, headers=auth_headers)
    assert res_comp.status_code == 200
    assert res_comp.json()["data"]["status"] == "completed"
    assert "interrupted the loop" in res_comp.json()["data"]["message"]


def test_goals_lifecycle(client, auth_headers):
    goal_payload = {
        "goal_lens": "Focus / Study",
        "title": "Keep daytime social scrolling under 20 mins",
        "target_metric": "daily_social_minutes",
        "target_value": 20.0,
        "unit": "minutes/day"
    }
    res = client.post("/api/v1/goals", json=goal_payload, headers=auth_headers)
    assert res.status_code == 200
    goal = res.json()["data"]
    assert goal["status"] == "active"
    goal_id = goal["id"]

    # Pause goal
    res_pause = client.put(f"/api/v1/goals/{goal_id}", json={"status": "paused"}, headers=auth_headers)
    assert res_pause.status_code == 200
    assert res_pause.json()["data"]["status"] == "paused"


def test_export_report_and_data_clear(client, auth_headers):
    res = client.get("/api/v1/export/report", headers=auth_headers)
    assert res.status_code == 200
    assert "export_metadata" in res.json()

    # Clear usage
    res_clear = client.delete("/api/v1/export/clear-usage", headers=auth_headers)
    assert res_clear.status_code == 200
    assert res_clear.json()["data"]["cleared"] is True


def test_csv_import_and_analysis_pipeline(client, auth_headers):
    import os
    csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "examples", "sample_usage.csv")
    with open(csv_path, "rb") as f:
        csv_bytes = f.read()

    # 1. Import CSV
    files = {"file": ("sample_usage.csv", io.BytesIO(csv_bytes), "text/csv")}
    res_import = client.post("/api/v1/usage/import", files=files, headers=auth_headers)
    assert res_import.status_code == 200
    import_data = res_import.json()["data"]
    assert import_data["imported_sessions"] > 30

    # 2. Run analysis
    res_analysis = client.post("/api/v1/analysis/run", headers=auth_headers)
    assert res_analysis.status_code == 200
    analysis_data = res_analysis.json()["data"]
    assert "habit_loops_detected" in analysis_data
    assert analysis_data["habit_loops_detected"] >= 1

    # 3. Check Dashboard
    res_dash = client.get("/api/v1/dashboard", headers=auth_headers)
    assert res_dash.status_code == 200
    dash_data = res_dash.json()["data"]
    assert dash_data["total_screen_time_minutes"] > 0
    assert dash_data["detected_habit_loops_count"] >= 1

    # 4. Check Digital Day
    res_dd = client.get("/api/v1/digital-day?view=week", headers=auth_headers)
    assert res_dd.status_code == 200
    dd_data = res_dd.json()["data"]
    assert len(dd_data["events"]) > 0
    assert dd_data["total_sessions"] > 0

    # 5. Check Habit Loops
    res_loops = client.get("/api/v1/habit-loops", headers=auth_headers)
    assert res_loops.status_code == 200
    loops = res_loops.json()["data"]
    assert len(loops) >= 1
    first_loop_id = loops[0]["id"]

    # Habit loop detail
    res_loop_detail = client.get(f"/api/v1/habit-loops/{first_loop_id}", headers=auth_headers)
    assert res_loop_detail.status_code == 200
    assert res_loop_detail.json()["data"]["id"] == first_loop_id

    # 6. Check Insights
    res_insights = client.get("/api/v1/insights", headers=auth_headers)
    assert res_insights.status_code == 200
    insights = res_insights.json()["data"]
    assert len(insights) >= 1

    # 7. Check Progress
    res_progress = client.get("/api/v1/progress", headers=auth_headers)
    assert res_progress.status_code == 200
    prog_data = res_progress.json()["data"]
    assert "weekly_evolution" in prog_data
    assert "daily_screen_time_trend" in prog_data

    # 8. Check Notifications and Apps
    res_notifs = client.get("/api/v1/notifications", headers=auth_headers)
    assert res_notifs.status_code == 200
    assert len(res_notifs.json()["data"]) > 0

    res_apps = client.get("/api/v1/apps", headers=auth_headers)
    assert res_apps.status_code == 200
    assert len(res_apps.json()["data"]) > 0


def test_insight_evidence_normalization(client, auth_headers):
    # Test that dashboard returns valid evidence list even if stored in various formats
    res = client.get("/api/v1/dashboard", headers=auth_headers)
    assert res.status_code == 200
    biggest = res.json()["data"]["biggest_insight"]
    if biggest and biggest.get("evidence"):
        assert isinstance(biggest["evidence"], list)
        for ev in biggest["evidence"]:
            assert isinstance(ev, str)

    # Test apps tracking endpoint
    res_tracking = client.get("/api/v1/apps/tracking", headers=auth_headers)
    assert res_tracking.status_code == 200
    assert "apps" in res_tracking.json()["data"]
    assert "categories" in res_tracking.json()["data"]

    # Test export CSV endpoint
    res_csv = client.get("/api/v1/export/csv", headers=auth_headers)
    assert res_csv.status_code == 200
    assert res_csv.headers["content-type"].startswith("text/csv")


def test_pdf_export_and_profile_update(client, auth_headers):
    # 1. Test PDF Export
    res_pdf = client.get("/api/v1/export/pdf", headers=auth_headers)
    assert res_pdf.status_code == 200
    assert res_pdf.headers["content-type"] == "application/pdf"
    assert res_pdf.content.startswith(b"%PDF")

    # 2. Test Profile & Email Update
    update_payload = {
        "display_name": "Updated Explorer",
        "email": "updated_explorer@habitloopmirror.dev",
        "goal_lens": "Sleep"
    }
    res_update = client.put("/api/v1/users/me", json=update_payload, headers=auth_headers)
    assert res_update.status_code == 200
    assert res_update.json()["data"]["display_name"] == "Updated Explorer"
    assert res_update.json()["data"]["goal_lens"] == "Sleep"

    # Verify /users/me reflects both new email and display_name
    res_me = client.get("/api/v1/users/me", headers=auth_headers)
    assert res_me.status_code == 200
    assert res_me.json()["data"]["email"] == "updated_explorer@habitloopmirror.dev"
    assert res_me.json()["data"]["profile"]["display_name"] == "Updated Explorer"


def test_clear_usage_wipes_reflections_and_goals(client, auth_headers):
    # Clear all data
    res_clear = client.delete("/api/v1/export/clear-usage", headers=auth_headers)
    assert res_clear.status_code == 200
    assert res_clear.json()["data"]["cleared"] is True

    # Check reflections
    res_refl = client.get("/api/v1/reflections", headers=auth_headers)
    assert res_refl.status_code == 200
    assert len(res_refl.json()["data"]) == 0

    # Check goals
    res_goals = client.get("/api/v1/goals", headers=auth_headers)
    assert res_goals.status_code == 200
    assert len(res_goals.json()["data"]) == 0



