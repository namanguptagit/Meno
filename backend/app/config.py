import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ZOOM_SDK_KEY: str = ""
    ZOOM_SDK_SECRET: str = ""
    DATABASE_URL: str = "postgresql://meno:meno@db:5432/meno"
    REDIS_URL: str = "redis://redis:6379/0"
    WHISPER_MODEL: str = "small"
    BOT_NAME: str = "Meno Bot"
    CLERK_SECRET_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    HF_TOKEN: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
