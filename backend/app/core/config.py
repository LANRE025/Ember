import os
from dataclasses import dataclass


@dataclass
class Settings:
    GOOGLE_CLOUD_PROJECT: str = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    GOOGLE_CLOUD_LOCATION: str = os.getenv("GOOGLE_CLOUD_LOCATION", "global")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    GEMINI_MODEL_FAST: str = os.getenv("GEMINI_MODEL_FAST") or os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    DB_PATH: str = os.getenv("DB_PATH", "./ember.db")
    PORT: int = int(os.getenv("PORT", "8081"))


settings = Settings()
