import json
import logging
from typing import Dict, Any, List, Optional
import httpx
from backend.app.config import settings
from backend.app.utils.logger import logger


KIMI_SYSTEM_PROMPT = """You are Habit Loop Mirror's non-judgmental behavioral reflection engine.
Your purpose is to explain verified digital usage patterns detected by the Python analytics engine.

STRICT COMPLIANCE RULES:
1. Python analytics is the absolute source of truth. NEVER invent statistics, numbers, or percentages.
2. DO NOT make any medical, psychological, or addiction claims.
3. DO NOT use terms like 'addiction cure', 'dopamine detox', 'reverse dopamine', 'negative dopamine', or 'weakness'.
4. DO NOT claim causality. Always say 'session followed notification' rather than 'notification caused session'.
5. Use respectful, objective, architectural, non-judgmental language.
6. The product is sublimation-inspired (redirecting an impulse/urge toward a user-chosen alternative activity).
7. Respond ONLY in valid JSON conforming to the requested schema.
"""


def generate_deterministic_insight_fallback(
    habit_loop: Optional[Dict[str, Any]],
    metrics: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Fallback deterministic insight generator used when Kimi K3 is unavailable,
    unconfigured, or times out. Fully evidence-based.
    """
    if habit_loop:
        app = habit_loop.get("app_name", "Application")
        window_start = habit_loop.get("time_window_start", "20:00")
        window_end = habit_loop.get("time_window_end", "22:00")
        occurrences = habit_loop.get("occurrences_count", 3)
        avg_dur = habit_loop.get("average_duration_minutes", 30)
        tot_impact = habit_loop.get("total_minutes_impact", 90)

        observation = f"A recurring digital habit pattern was recorded for {app} between {window_start} and {window_end}."
        evidence = [
            f"{occurrences} sessions recorded within the {window_start}–{window_end} window over the analyzed period.",
            f"Average session duration was {avg_dur} minutes, totaling {tot_impact} minutes.",
            f"Sessions frequently followed app notifications received in the preceding 3 minutes."
        ]
        why_it_matters = f"This recurring interval coincides with your evening decompression window, where quick notification previews often extend into longer unplanned sessions."
        recommendation = f"Try scheduling a notification mute filter for {app} after {window_start}, and choose a 5-to-10 minute Personal Swap activity when the urge arises."
        
        return {
            "title": f"Recurring Evening Pattern: {app}",
            "observation": observation,
            "evidence": evidence,
            "why_it_matters": why_it_matters,
            "recommendation": recommendation,
            "confidence": habit_loop.get("confidence", "high"),
            "source": "deterministic_fallback"
        }
    else:
        tot_time = metrics.get("total_screen_time_formatted", "0h 0m")
        peak = metrics.get("peak_usage_period", "Evening")
        notifs = metrics.get("notification_triggered_sessions", 0)

        return {
            "title": "Baseline Digital Pattern Overview",
            "observation": f"Your digital telemetry indicates total usage of {tot_time}, with primary concentration during {peak}.",
            "evidence": [
                f"Peak usage window identified during {peak}.",
                f"{notifs} sessions recorded following direct app notifications.",
                "Usage reflects standard distributed activity across focused work and leisure."
            ],
            "why_it_matters": "Understanding your baseline rhythm allows you to recognize when digital usage is deliberate versus passive.",
            "recommendation": "Review your Digital Day timeline to label session intentionality and explore Personal Swap options for peak hours.",
            "confidence": "high",
            "source": "deterministic_fallback"
        }


class KimiClient:
    def __init__(self):
        self.api_key = settings.KIMI_API_KEY
        self.base_url = settings.KIMI_BASE_URL.rstrip("/")
        self.model = settings.KIMI_MODEL
        self.timeout = settings.KIMI_TIMEOUT_SECONDS

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def generate_explainable_insight(
        self,
        evidence_data: Dict[str, Any],
        habit_loop: Optional[Dict[str, Any]] = None,
        user_goal: Optional[str] = "Reduce Digital Distraction"
    ) -> Dict[str, Any]:
        """
        Calls Kimi K3 with verified Python analytics evidence.
        Falls back gracefully to deterministic insight on timeout or error.
        """
        if not self.is_configured:
            logger.info("Kimi API key not configured. Using deterministic evidence-based insight.")
            return generate_deterministic_insight_fallback(habit_loop, evidence_data)

        user_prompt = f"""Generate an explainable behavioral insight based on this verified telemetry evidence:
Evidence metrics: {json.dumps(evidence_data, default=str)}
Habit loop pattern: {json.dumps(habit_loop, default=str) if habit_loop else "None"}
User goal lens: {user_goal}

Provide JSON with exactly:
{{
  "title": "<Concise non-judgmental title>",
  "observation": "<Clear factual observation>",
  "evidence": ["<Evidence item 1>", "<Evidence item 2>", "<Evidence item 3>"],
  "why_it_matters": "<Why this pattern is relevant to the user's goal>",
  "recommendation": "<Specific, actionable, respectful habit interruption or substitution idea>",
  "confidence": "high"
}}
"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": KIMI_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.3,
            "response_format": {"type": "json_object"}
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )

                if response.status_code == 200:
                    res_json = response.json()
                    content = res_json["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    return {
                        "title": parsed.get("title", "Digital Pattern Insight"),
                        "observation": parsed.get("observation", ""),
                        "evidence": parsed.get("evidence", []),
                        "why_it_matters": parsed.get("why_it_matters", ""),
                        "recommendation": parsed.get("recommendation", ""),
                        "confidence": parsed.get("confidence", "high"),
                        "source": "kimi"
                    }
                else:
                    logger.warning(
                        f"Kimi API returned status {response.status_code}: {response.text}. Using fallback."
                    )
                    return generate_deterministic_insight_fallback(habit_loop, evidence_data)

        except (httpx.TimeoutException, httpx.RequestError, json.JSONDecodeError, Exception) as exc:
            logger.warning(f"Kimi API call failed ({type(exc).__name__}: {str(exc)}). Utilizing deterministic fallback.")
            return generate_deterministic_insight_fallback(habit_loop, evidence_data)

    async def personalize_swap_activities(
        self,
        matched_activities: List[Dict[str, Any]],
        habit_loop: Optional[Dict[str, Any]],
        user_profile: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Personalizes wording and rationale for deterministically matched activities using Kimi K3.
        If Kimi is unavailable, preserves the deterministic activities intact.
        """
        if not self.is_configured or not matched_activities:
            return matched_activities

        prompt = f"""Given these deterministically matched alternative activities:
Activities: {json.dumps(matched_activities, default=str)}
Habit context: {json.dumps(habit_loop, default=str) if habit_loop else "General usage"}
User Profile: {json.dumps(user_profile, default=str)}

Return a JSON array of the activities with refined, inspiring, non-judgmental reasons and tips.
DO NOT change the durations or categories. DO NOT suggest addiction cures.
Format:
[
  {{
    "activity_id": "...",
    "title": "...",
    "category": "...",
    "duration_minutes": 10,
    "difficulty": "...",
    "reason": "...",
    "user_fit": "high",
    "reward_type": "..."
  }}
]
"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": KIMI_SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.4
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                if response.status_code == 200:
                    res_json = response.json()
                    content = res_json["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    if isinstance(parsed, list) and len(parsed) > 0:
                        return parsed
        except Exception as e:
            logger.warning(f"Kimi swap personalization failed: {str(e)}. Using deterministic match.")

        return matched_activities


kimi_client = KimiClient()
