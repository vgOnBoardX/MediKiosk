from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    groq_api_key: str = "your-groq-api-key"
    gemini_api_key: str = "your-gemini-api-key"
    qdrant_url: str = "http://localhost:6333"
    environment: str = "development"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
