from typing import Optional, List
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    category: str
    icon_name: str


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    app_name: str
    timestamp: datetime
    title: str
    content_preview: str


class UsageSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    app_name: str
    start_time: datetime
    end_time: datetime
    duration_minutes: float
    is_long_session: bool
    notification_associated: bool
    notification_id: Optional[UUID] = None
    reflection_label: Optional[str] = None


class ManualUsageRequest(BaseModel):
    app_name: str = Field(..., min_length=1, max_length=100)
    category: Optional[str] = "Productivity"
    start_time: datetime
    end_time: datetime
    notification_associated: bool = False
    notification_title: Optional[str] = None
    reflection_label: Optional[str] = None


class CsvImportResult(BaseModel):
    total_records: int
    imported_sessions: int
    imported_notifications: int
    skipped_duplicates: int
    validation_warnings: List[str] = Field(default_factory=list)
