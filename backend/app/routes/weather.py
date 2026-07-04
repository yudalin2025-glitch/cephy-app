"""
天气路由模块
- GET /api/v1/weather/today      — 今日天气
- GET /api/v1/weather/forecast   — 未来 N 天预报
"""

from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.deps import get_db, get_current_user
from app.models import User, WeatherData
from app.schemas import WeatherResponse, ForecastResponse
from app.services.weather import fetch_today_weather, fetch_forecast

router = APIRouter(prefix="/api/v1/weather", tags=["天气"])


@router.get("/today", response_model=WeatherResponse, summary="获取今日天气")
def get_today_weather(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    获取当前用户所在位置的今日天气数据。
    优先从数据库缓存读取，若无缓存则调用 OpenWeatherMap API 获取。
    """
    today = date.today()

    # 先从数据库查询今日是否有缓存
    cached = (
        db.query(WeatherData)
        .filter(
            WeatherData.user_id == current_user.id,
            WeatherData.date == today,
        )
        .first()
    )
    if cached:
        return WeatherResponse.model_validate(cached)

    # 无缓存，调用外部 API 获取
    try:
        weather_data = fetch_today_weather(current_user)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"获取天气数据失败: {str(e)}",
        )

    if weather_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="无法获取天气数据，请检查位置设置和 API Key",
        )

    # 存入数据库缓存
    record = WeatherData(
        user_id=current_user.id,
        date=today,
        **weather_data,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return WeatherResponse.model_validate(record)


@router.get("/forecast", response_model=ForecastResponse, summary="获取天气预报")
def get_forecast(
    days: int = Query(7, ge=1, le=16, description="预报天数（1-16）"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    获取未来 N 天的天气预报。
    优先使用数据库缓存，不足时调用外部 API 补充。
    """
    today = date.today()
    end_date = today + timedelta(days=days)

    # 从数据库读取已有缓存
    cached_records = (
        db.query(WeatherData)
        .filter(
            WeatherData.user_id == current_user.id,
            WeatherData.date >= today,
            WeatherData.date <= end_date,
        )
        .order_by(WeatherData.date)
        .all()
    )

    # 如果数据库已有足够数据则直接返回
    cached_dates = {r.date for r in cached_records}
    missing_dates = []
    for i in range(days):
        d = today + timedelta(days=i)
        if d not in cached_dates:
            missing_dates.append(d)

    if missing_dates:
        # 调用 API 获取缺失的数据
        try:
            forecast_data_list = fetch_forecast(current_user, days)
        except Exception as e:
            if cached_records:
                # 有缓存数据则返回缓存数据（降级）
                pass
            else:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"获取天气预报失败: {str(e)}",
                )

        for fdata in forecast_data_list:
            record = WeatherData(
                user_id=current_user.id,
                **fdata,
            )
            db.add(record)

        db.commit()

        # 重新查询
        cached_records = (
            db.query(WeatherData)
            .filter(
                WeatherData.user_id == current_user.id,
                WeatherData.date >= today,
                WeatherData.date <= end_date,
            )
            .order_by(WeatherData.date)
            .all()
        )

    return ForecastResponse(
        items=[WeatherResponse.model_validate(r) for r in cached_records],
    )
