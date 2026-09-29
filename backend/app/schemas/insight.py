from typing import List, Optional, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, field_validator


class InsightResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type: str  # maps to insight_type in model
    title: str
    observation: str
    evidence: List[str]
    why_it_matters: str
    recommendation: str
    confidence: str
    source: str
    created_at: datetime
    habit_loop_id: Optional[UUID] = None

    @field_validator("evidence", mode="before")
    @classmethod
    def normalize_evidence(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            try:
                import json
                v = json.loads(v)
            except Exception:
                return [v]
        if isinstance(v, list):
            res = []
            for item in v:
                if isinstance(item, dict):
                    res.append(str(item.get("label") or item.get("text") or item.get("evidence") or item))
                else:
                    res.append(str(item))
            return res
        return []

