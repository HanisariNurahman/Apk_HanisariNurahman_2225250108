"""Konfigurasi dari variabel lingkungan / .env. Rahasia tidak pernah ditulis di kode."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "sqlite:///./peluangku.db"
    # Format: "8A:kunci-a,8B:kunci-b"
    class_keys: str = ""
    teacher_token: str = ""
    frontend_origin: str = "http://localhost:5173"

    @property
    def class_key_map(self) -> dict[str, str]:
        pairs: dict[str, str] = {}
        for item in self.class_keys.split(","):
            code, sep, key = item.strip().partition(":")
            if sep and code.strip() and key.strip():
                pairs[code.strip()] = key.strip()
        return pairs

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.frontend_origin.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
