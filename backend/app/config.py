from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """All secrets come from the environment (.env). There are deliberately no defaults
    for DATABASE_URL and JWT_SECRET: the app refuses to start without them."""

    model_config = SettingsConfigDict(env_file=str(ROOT / ".env"), extra="ignore")

    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 480
    cookie_secure: bool = False
    cors_origins: str = "http://localhost:5173"
    max_upload_mb: int = 10
    rate_limit_enabled: bool = True
    max_forecast_years: int = 5
    default_forecast_years: int = 3
    models_dir: str = "models"
    uploads_dir: str = "data/uploads"
    sample_dir: str = "data/sample"
    seed_sample_data: bool = False
    admin_email: str = ""
    admin_password: str = ""
    serve_frontend: bool = True
    frontend_dist: str = "frontend/dist"

    @field_validator("jwt_secret")
    @classmethod
    def _secret_len(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters")
        return v

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    def path(self, p: str) -> Path:
        q = Path(p)
        return q if q.is_absolute() else ROOT / q


@lru_cache
def get_settings() -> Settings:
    return Settings()
