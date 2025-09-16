from pydantic_settings import BaseSettings
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    JWT_SECRET: str = os.getenv("JWT_SECRET")
    JWT_ALG: str = os.getenv("JWT_ALG")
    ACCESS_TTL_MIN: int = os.getenv("ACCESS_TTL_MIN")
    REFRESH_TTL_DAYS: int = os.getenv("REFRESH_TTL_DAYS")


settings = Settings()