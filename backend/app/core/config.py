# ============================================================
# DealFlow360 — Application Configuration
# ============================================================
# Responsibilities:
#   - Load all environment variables via pydantic-settings
#   - Database URL, JWT secrets, email config, AI API keys
#   - Single source of truth for all config values
# ============================================================

# TODO: implement when starting backend development
#
# from pydantic_settings import BaseSettings
#
# class Settings(BaseSettings):
#     # App
#     APP_NAME: str = "DealFlow360"
#     DEBUG: bool = False
#
#     # Database
#     DATABASE_URL: str                  # postgresql+asyncpg://...
#
#     # Auth
#     SECRET_KEY: str                    # JWT signing secret
#     ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
#     INVITE_TOKEN_EXPIRE_HOURS: int = 48
#
#     # Email (Resend)
#     RESEND_API_KEY: str
#     EMAIL_FROM: str = "noreply@dealflow360.com"
#
#     # AI / LLM
#     OPENAI_API_KEY: str = ""           # or Gemini / Anthropic
#
#     class Config:
#         env_file = ".env"
#
# settings = Settings()
