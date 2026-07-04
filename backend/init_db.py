"""
数据库初始化脚本
运行所有 ORM 模型的 Base.metadata.create_all 创建表结构
用于开发环境快速初始化，生产环境建议使用 Alembic 迁移
"""

import logging
import sys
import os

# 将项目根目录加入 sys.path，确保可以导入 app 包
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("init_db")


def init_database():
    """初始化数据库：创建所有表"""
    from app.database import engine, Base
    from app.models import (
        User, MigraineAttack, AttackSymptom, AttackTrigger,
        Medication, WeatherData, RiskScore, DoctorReport,
        Subscription, AppSetting,
    )

    logger.info("=" * 50)
    logger.info("Cephy 数据库初始化")
    logger.info("=" * 50)
    logger.info(f"数据库连接: {engine.url}")

    # 创建所有表
    logger.info("正在创建数据库表...")
    Base.metadata.create_all(bind=engine)

    # 列出已创建的表
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    logger.info(f"数据库初始化完成！已创建 {len(tables)} 张表：")
    for table_name in sorted(tables):
        columns = [col["name"] for col in inspector.get_columns(table_name)]
        logger.info(f"  📋 {table_name} ({len(columns)} 字段): {', '.join(columns[:8])}{'...' if len(columns) > 8 else ''}")

    logger.info("=" * 50)
    logger.info("初始化成功！可以通过以下命令启动服务：")
    logger.info("  cd backend")
    logger.info("  uvicorn app.main:app --reload")
    logger.info("=" * 50)


if __name__ == "__main__":
    try:
        init_database()
    except Exception as e:
        logger.error(f"数据库初始化失败: {e}", exc_info=True)
        sys.exit(1)
