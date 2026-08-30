import os
import secrets

DEFAULT_MAX_UPLOAD_SIZE = 5 * 1024 * 1024


class Settings:
    """Application configuration, read lazily from the environment.

    Every value carries a working default so the process boots on a fresh
    clone without any manual setup. ``SECRET_KEY`` falls back to a random
    per-start value (the spec requires exactly that), so it is never a
    hardcoded secret in the repository.
    """

    def __init__(self) -> None:
        self.secret_key: str = os.environ.get("SECRET_KEY") or secrets.token_hex(32)
        self.database_url: str = os.environ.get("DATABASE_URL", "sqlite:///./wardrobe.db")
        raw_origins: str = os.environ.get("CORS_ORIGINS", "http://localhost:5173")
        self.cors_origins: list[str] = [o.strip() for o in raw_origins.split(",") if o.strip()]
        self.upload_dir: str = os.environ.get("UPLOAD_DIR", "uploads/")
        self.max_upload_size: int = int(
            os.environ.get("MAX_UPLOAD_SIZE", str(DEFAULT_MAX_UPLOAD_SIZE))
        )


settings = Settings()
