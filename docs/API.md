# Habit Loop Mirror — API Documentation

Base URL: `/api/v1`

All responses follow the consistent, typed contract:

### Success Contract
```json
{
  "success": true,
  "data": { ... },
  "message": "Human-readable status"
}
```

### Error Contract
```json
{
  "success": false,
  "data": null,
  "message": "Human-readable error explanation",
  "error_code": "ERROR_CODE"
}
```

---

## 1. System Health

### `GET /health`
Returns backend health status, database connectivity, and AI adapter status.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": {
      "connected": true,
      "error": null
    },
    "ai_service": {
      "status": "fallback_active",
      "provider": "Kimi K3 (Moonshot AI)",
      "model": "moonshot-v1-8k",
      "fallback_available": true
    },
    "uptime_seconds": 128.4
  },
  "message": "Backend health verified"
}
```

---

## 2. User & Personalization Profile

### `GET /users/me`
Retrieves current user identity, profile, and onboarding completion status. Requires `Authorization: Bearer <token>`.

### `PUT /users/me`
Updates user profile settings (display name, timezone, goal lens).

### `POST /users/onboarding`
Saves answers to the 10 personalization onboarding questions and marks `onboarding_completed: true`.

**Request Example:**
```json
{
  "display_name": "Alex",
  "favorite_activities": ["coding", "drawing", "music"],
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
```

---

## 3. Digital Usage & CSV Telemetry

### `POST /usage/import`
Accepts a multipart `file` (.csv). Validates columns, timestamps, non-negative durations, and associates notifications within 3 minutes before sessions. Prevents duplicate imports.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "total_records": 18,
    "imported_sessions": 18,
    "imported_notifications": 8,
    "skipped_duplicates": 0,
    "validation_warnings": []
  },
  "message": "Successfully imported 18 sessions (0 skipped duplicates)."
}
```

### `POST /usage/manual`
Allows recording a single manual session.

---

## 4. Behavioral Analysis & Habit Loops

### `POST /analysis/run`
Executes the ground truth analytics pipeline:
1. Python analytics calculates ground truth statistics and habit loops
2. Ground truth evidence is structured
3. Kimi K3 generates explainable insights (or deterministic fallback)
4. Telemetry is saved to database

### `GET /habit-loops`
Retrieves all detected habit loops for the user.

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "id": "e8a93cb3-c155-46aa-b3e1-cc809a7dcda5",
      "app_name": "Instagram",
      "trigger_description": "Instagram notification in the 20:00 to 22:00 window",
      "action_description": "Instagram opened shortly after notification",
      "time_window_start": "20:00",
      "time_window_end": "22:00",
      "occurrences_count": 4,
      "total_days_analyzed": 7,
      "average_duration_minutes": 35.5,
      "total_minutes_impact": 142.0,
      "confidence": "high",
      "status": "active",
      "recommendation": "Consider configuring scheduled summary or muting notifications for Instagram between 20:00 and 22:00."
    }
  ],
  "message": "Found 1 habit loops"
}
```

### `GET /habit-loops/{id}/evidence`
Returns timestamps and latency records proving the detected pattern.

---

## 5. AI Insights

### `GET /insights`
Retrieves explainable AI insights conforming to the structure:
- `observation`
- `evidence[]`
- `why_it_matters`
- `recommendation`

---

## 6. Personal Swap (Activity Substitution)

### `GET /personal-swap`
Returns current suggested alternative activities across 2-minute, 10-minute, and 20-minute tiers.

### `POST /personal-swap/generate`
Generates fresh personalized alternatives using deterministic preference matching before AI wording.

### `POST /personal-swap/{id}/start`
Transitions a swap to `started`.

### `POST /personal-swap/{id}/complete`
Records completion and updates habit loop status.
Message returned: `"Nice. You interrupted the loop with an activity you chose."`

### `POST /personal-swap/{id}/skip`
Skips alternative without guilt or negative judgment.

---

## 7. Intentionality Reflections

### `GET /reflections`
Retrieves recorded reflections.

### `GET /reflections/stats`
Returns composition breakdown across `Planned`, `Necessary`, `Relaxation`, `Unplanned`.

### `POST /reflections`
Records reflection for a session or general day check-in.

---

## 8. Goals & Progress

### `GET /goals`
Returns active goals and target thresholds across lenses.

### `POST /goals`
Creates a new self-regulation goal.

### `GET /progress`
Calculates week-over-week screen time change, habit evolution, and verified time reclaimed.

---

## 9. Privacy & Export

### `GET /export/report`
Streams full telemetry and reflection JSON report as attachment.

### `DELETE /export/clear-usage`
Erases imported usage sessions while preserving personalization profile.

### `DELETE /export/account`
Permanently erases user account and all cascading records.
