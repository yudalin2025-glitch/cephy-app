"""
应用配置模块
从 .env 文件读取配置，提供类型安全的 Settings 类
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """应用全局配置，从环境变量或 .env 文件加载"""

    # 数据库连接（默认 SQLite 开发模式）
    DATABASE_URL: str = "sqlite:///./cephy_dev.db"

    # JWT 配置
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24 小时

    # 第三方 API Key（可选）
    GEMINI_API_KEY: Optional[str] = None
    OPENWEATHERMAP_API_KEY: Optional[str] = None

    # Apple Sign-In 配置（可选）
    APPLE_TEAM_ID: Optional[str] = None
    APPLE_KEY_ID: Optional[str] = None
    APPLE_PRIVATE_KEY_PATH: Optional[str] = None

    # 日志级别
    LOG_LEVEL: str = "INFO"

    # 语音文件上传目录
    UPLOAD_DIR: str = "uploads"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


# 全局单例配置实例
settings = Settings()
