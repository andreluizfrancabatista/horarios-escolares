from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://horarios:horarios123@localhost:5432/horarios_db"
    SECRET_KEY: str = "changeme-super-secret-key-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    FIRST_ADMIN_EMAIL: str = "admin@escola.edu.br"
    FIRST_ADMIN_PASSWORD: str = "admin123"

    class Config:
        env_file = ".env"


settings = Settings()
