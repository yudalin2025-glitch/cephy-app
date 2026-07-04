"""
数据库连接模块
创建 SQLAlchemy engine 和 sessionmaker，提供数据库会话管理
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

# 创建 SQLAlchemy Engine
# 注意：SQLite 默认不支持并发写，开发模式够用；生产请切换至 PostgreSQL
engine = create_engine(
    settings.DATABASE_URL,
    echo=False,                     # 生产环境建议关闭
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
)

# Session 工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 声明性基类 —— 所有 ORM 模型继承此类
Base = declarative_base()


def get_db():
    """
    获取数据库会话的依赖注入生成器
    每次请求自动获取一个 session，请求结束后关闭
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
