import os
from dataclasses import dataclass


@dataclass
class Settings:
    GOOGLE_CLOUD_PROJECT: str = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    GOOGLE_CLOUD_LOCATION: str = os.getenv("GOOGLE_CLOUD_LOCATION", "global")
    GOOGLE_GENAI_USE_VERTEXAI: str = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "true")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    GEMINI_MODEL_FAST: str = os.getenv("GEMINI_MODEL_FAST") or os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "auto")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "")
    AI_FALLBACK_PROVIDER: str = os.getenv("AI_FALLBACK_PROVIDER", "none")
    AI_TIMEOUT_SECONDS: float = float(os.getenv("AI_TIMEOUT_SECONDS", "20"))
    DB_PATH: str = os.getenv("DB_PATH", "./ember.db")
    PORT: int = int(os.getenv("PORT", "8081"))


settings = Settings()

