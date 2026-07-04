"""
FastAPI 应用入口
挂载所有路由，配置 CORS、中间件等。
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routes import (
    auth,
    attacks,
    voice,
    weather,
    risk,
    reports,
    subscriptions,
)

# 配置日志
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    logger.info("Cephy 后端服务启动中...")
    logger.info(f"数据库连接: {settings.DATABASE_URL}")
    logger.info(f"Gemini API 已配置: {bool(settings.GEMINI_API_KEY)}")
    logger.info(f"OpenWeatherMap API 已配置: {bool(settings.OPENWEATHERMAP_API_KEY)}")

    # 确保所有表已创建（生产环境建议使用 Alembic 迁移）
    # 注意：init_db.py 是独立的初始化脚本，这里不自动建表
    yield

    logger.info("Cephy 后端服务关闭")


app = FastAPI(
    title="Cephy 偏头痛管理 API",
    description="""
    Cephy 偏头痛管理后端 API
    
    功能：
    - 用户认证（邮箱/Apple Sign-In）
    - 偏头痛发作记录 CRUD
    - 语音输入转写与 AI 解析
    - 天气数据查询
    - 偏头痛风险评分
    - 医生报告生成
    - 订阅管理
    """,
    version="1.0.0",
    lifespan=lifespan,
)

# === CORS 配置 ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限定具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === 路由注册 ===
app.include_router(auth.router)
app.include_router(attacks.router)
app.include_router(voice.router)
app.include_router(weather.router)
app.include_router(risk.router)
app.include_router(reports.router)
app.include_router(subscriptions.router)


@app.get("/health", tags=["健康检查"])
def health_check():
    """服务健康检查端点"""
    return {
        "status": "ok",
        "version": "1.0.0",
    }
