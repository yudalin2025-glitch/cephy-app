"""
风险评分规则引擎
根据用户的近期发作数据、天气数据、气象变化等综合计算今日偏头痛风险评分。
"""

import logging
from datetime import date, timedelta
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import User, MigraineAttack, WeatherData

logger = logging.getLogger(__name__)


def calculate_risk_score(user: User, db: Session) -> dict:
    """
    计算用户今日的偏头痛风险评分

    评分因素权重：
    - 近期发作频率（40%）：过去 7 天的发作频率
    - 近期严重程度（20%）：过去 7 天的平均严重程度
    - 天气变化（20%）：气压和温度的剧烈变化
    - 历史模式（20%）：用户的长期发作模式、诊断类型等

    Args:
        user: 用户对象
        db: 数据库 session

    Returns:
        {
            "score": 0-100 的风险评分,
            "level": "low"/"medium"/"high",
            "model_version": "rule_v1",
            "factors": {各因素详细评分}
        }
    """
    today = date.today()
    seven_days_ago = today - timedelta(days=30)
    factors = {}

    # === 1. 近期发作频率（40%） ===
    recent_attacks = (
        db.query(func.count(MigraineAttack.id))
        .filter(
            MigraineAttack.user_id == user.id,
            func.date(MigraineAttack.started_at) >= seven_days_ago,
            func.date(MigraineAttack.started_at) <= today,
        )
        .scalar()
    ) or 0

    # 过去 30 天发作 ≥8 次 => 高频率（全分）
    frequency_score = min(40, (recent_attacks / 8) * 40)
    factors["attack_frequency"] = round(frequency_score, 1)

    # === 2. 近期平均严重程度（20%） ===
    avg_severity = (
        db.query(func.avg(MigraineAttack.severity_score))
        .filter(
            MigraineAttack.user_id == user.id,
            func.date(MigraineAttack.started_at) >= seven_days_ago,
            func.date(MigraineAttack.started_at) <= today,
        )
        .scalar()
    ) or 0

    # 严重程度 10 => 全分 20
    severity_score = (avg_severity / 10) * 20 if avg_severity else 0
    factors["severity"] = round(severity_score, 1)

    # === 3. 天气变化（20%） ===
    weather_data = (
        db.query(WeatherData)
        .filter(
            WeatherData.user_id == user.id,
            WeatherData.date >= today - timedelta(days=2),
            WeatherData.date <= today,
        )
        .order_by(WeatherData.date.desc())
        .all()
    )

    weather_score = 0.0
    if weather_data:
        # 气压变化：24h 变化 > 8 hPa 显著增加风险
        pressure_change = abs(weather_data[0].pressure_change_24h or 0)
        if pressure_change > 8:
            weather_score += 10
        elif pressure_change > 5:
            weather_score += 5

        # 温度变化：24h 变化 > 10°C
        temp_change = abs(weather_data[0].temp_change_24h or 0)
        if temp_change > 10:
            weather_score += 5
        elif temp_change > 5:
            weather_score += 3

        # 湿度高 > 80%
        humidity = weather_data[0].humidity or 50
        if humidity > 80:
            weather_score += 5
        elif humidity > 70:
            weather_score += 2

    factors["weather"] = round(min(20, weather_score), 1)

    # === 4. 历史模式与用户特征（20%） ===
    profile_score = 0.0

    # 诊断类型：慢性 > 发作性
    dx = (user.diagnosis_type or "").lower()
    if dx == "chronic":
        profile_score += 10
    elif dx == "episodic":
        profile_score += 5

    # 如果用户刚注册不久（< 7天），降低历史因素权重
    if user.created_at:
        user_age_days = (today - user.created_at.date()).days
        if user_age_days < 7:
            profile_score *= 0.3

    factors["user_profile"] = round(min(20, profile_score), 1)

    # === 总分 ===
    total_score = frequency_score + severity_score + weather_score + profile_score
    total_score = round(min(100, max(0, total_score)))

    # 等级评定
    if total_score >= 60:
        level = "high"
    elif total_score >= 30:
        level = "medium"
    else:
        level = "low"

    return {
        "score": total_score,
        "level": level,
        "model_version": "rule_v1",
        "factors": factors,
    }
