"""
风险评分路由模块
- GET /api/v1/risk/today     — 今日风险评分
- GET /api/v1/risk/history   — 历史风险评分趋势
"""

from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.deps import get_db, get_current_user
from app.models import User, RiskScore
from app.schemas import RiskScoreResponse, RiskHistoryResponse
from app.services.risk_engine import calculate_risk_score

router = APIRouter(prefix="/api/v1/risk", tags=["风险评分"])


@router.get("/today", response_model=RiskScoreResponse, summary="获取今日风险评分")
def get_today_risk(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    获取今日偏头痛风险评分。
    优先返回数据库中的缓存评分；若无缓存则实时计算并存储。
    """
    today = date.today()

    # 查询数据库是否有今日的缓存评分
    cached = (
        db.query(RiskScore)
        .filter(
            RiskScore.user_id == current_user.id,
            RiskScore.date == today,
        )
        .first()
    )
    if cached:
        return RiskScoreResponse.model_validate(cached)

    # 实时计算风险评分
    risk_result = calculate_risk_score(current_user, db)

    # 存入数据库
    risk_record = RiskScore(
        user_id=current_user.id,
        date=today,
        score=risk_result["score"],
        level=risk_result["level"],
        model_version=risk_result.get("model_version", "rule_v1"),
        factors=risk_result.get("factors", {}),
    )
    db.add(risk_record)
    db.commit()
    db.refresh(risk_record)

    return RiskScoreResponse.model_validate(risk_record)


@router.get("/history", response_model=RiskHistoryResponse, summary="获取历史风险评分趋势")
def get_risk_history(
    days: int = Query(30, ge=1, le=365, description="回溯天数"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    获取过去 N 天的历史风险评分趋势数据。
    缺失日期的评分会自动计算并补充。
    """
    today = date.today()
    start_date = today - timedelta(days=days)

    # 查询已有记录
    existing_records = (
        db.query(RiskScore)
        .filter(
            RiskScore.user_id == current_user.id,
            RiskScore.date >= start_date,
            RiskScore.date <= today,
        )
        .order_by(RiskScore.date)
        .all()
    )

    # 填充缺失日期
    existing_dates = {r.date for r in existing_records}
    for i in range(days):
        d = start_date + timedelta(days=i)
        if d not in existing_dates and d <= today:
            risk_result = calculate_risk_score(current_user, db)
            record = RiskScore(
                user_id=current_user.id,
                date=d,
                score=risk_result["score"],
                level=risk_result["level"],
                model_version=risk_result.get("model_version", "rule_v1"),
                factors=risk_result.get("factors", {}),
            )
            db.add(record)

    if days > len(existing_dates):
        db.commit()

    # 最终查询
    all_records = (
        db.query(RiskScore)
        .filter(
            RiskScore.user_id == current_user.id,
            RiskScore.date >= start_date,
            RiskScore.date <= today,
        )
        .order_by(RiskScore.date)
        .all()
    )

    # 计算趋势
    trend = _calculate_trend(all_records)

    return RiskHistoryResponse(
        items=[RiskScoreResponse.model_validate(r) for r in all_records],
        trend=trend,
    )


def _calculate_trend(records: list) -> str:
    """
    根据最近的风险评分变化判断趋势
    :returns: "improving", "worsening", "stable"
    """
    if len(records) < 7:
        return "stable"

    # 取最近 7 天的平均值与前 7 天的平均值做比较
    recent = [r.score for r in records[-7:]]
    older = [r.score for r in records[-14:-7]]

    if not older:
        return "stable"

    recent_avg = sum(recent) / len(recent)
    older_avg = sum(older) / len(older)

    diff = recent_avg - older_avg
    if diff > 10:
        return "worsening"
    elif diff < -10:
        return "improving"
    else:
        return "stable"
