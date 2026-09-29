from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "Habit Loop Mirror"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Database
    # Supports SQLite for zero-config local testing and PostgreSQL for Supabase/production
    DATABASE_URL: str = "sqlite:///./habit_loop_mirror.db"

    # Supabase Auth
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    SUPABASE_JWT_AUDIENCE: str = "authenticated"

    # Kimi AI Client
    KIMI_API_KEY: str = ""
    KIMI_BASE_URL: str = "https://api.moonshot.cn/v1"
    KIMI_MODEL: str = "moonshot-v1-8k"
    KIMI_TIMEOUT_SECONDS: float = 15.0

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://*.vercel.app"
    ]

    # Analytics Thresholds (Configurable)
    HABIT_LOOP_NOTIFICATION_WINDOW_MINUTES: int = 3
    HABIT_LOOP_LONG_SESSION_MINUTES: int = 30
    HABIT_LOOP_MIN_OCCURRENCES: int = 3
    HABIT_LOOP_TIME_WINDOW_HOURS: int = 2
    HABIT_LOOP_ANALYSIS_DAYS: int = 7


settings = Settings()
