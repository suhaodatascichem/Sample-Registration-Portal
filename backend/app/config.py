from typing import Any
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5433/lab_sample_intake"
    gemini_api_key: str = ""
    google_api_key: str = ""
    openai_api_key: str = ""
    cors_origins: list[str] = ["*"]

    @field_validator("database_url", mode="before")
    @classmethod
    def fix_postgres_scheme(cls, v: Any) -> str:
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
