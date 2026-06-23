from pydantic import field_validator
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg://postgres:password@localhost:5432/ragulin_db"
    SECRET_KEY: str = "change-this-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    UPLOAD_DIR: str = "static/uploads"
    ADMIN_EMAIL: str = "admin@ragulin.ru"
    ADMIN_PASSWORD: str = "Admin123!"
    TELEGRAM_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v: object) -> List[str]:
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                import json
                return json.loads(v)
            return [o.strip() for o in v.split(",") if o.strip()]
        return v  # type: ignore[return-value]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
