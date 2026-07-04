"""
OpenWeatherMap 天气数据服务
提供获取今日天气和天气预报的功能。
没有 API key 时返回模拟数据集。
"""

import logging
import random
from datetime import date, timedelta, datetime
from typing import Optional, List

import httpx

from app.config import settings
from app.models import User

logger = logging.getLogger(__name__)

# === Mock 天气数据生成 ===
_MOCK_CONDITIONS = ["Clear", "Clouds", "Rain", "Drizzle", "Thunderstorm", "Snow", "Mist", "Fog"]
_MOCK_CONDITIONS_CN = ["晴天", "多云", "雨", "毛毛雨", "雷暴", "雪", "薄雾", "雾"]


def _generate_mock_weather(target_date: date) -> dict:
    """生成模拟天气数据"""
    condition_idx = random.randint(0, len(_MOCK_CONDITIONS) - 1)
    base_pressure = 1013 + random.randint(-20, 20)

    return {
        "date": target_date,
        "pressure": round(base_pressure + random.randint(-5, 5), 1),
        "pressure_change_24h": round(random.uniform(-10, 10), 1),
        "humidity": round(random.uniform(40, 95), 1),
        "temp_high": round(random.uniform(18, 38), 1),
        "temp_low": round(random.uniform(10, 28), 1),
        "temp_change_24h": round(random.uniform(-5, 5), 1),
        "wind_speed": round(random.uniform(0, 30), 1),
        "weather_condition": _MOCK_CONDITIONS[condition_idx],
        "latitude": 21.0285,
        "longitude": 105.8542,
    }


def fetch_today_weather(user: User) -> Optional[dict]:
    """
    获取今日天气数据

    Args:
        user: 用户对象（用于获取位置信息）

    Returns:
        天气数据字典，失败返回 None
    """
    if not settings.OPENWEATHERMAP_API_KEY:
        logger.warning("未配置 OPENWEATHERMAP_API_KEY，返回 mock 天气数据")
        return _generate_mock_weather(date.today())

    # 从用户 settings 或 profile 获取位置（简化：使用固定坐标）
    lat = 21.0285
    lon = 105.8542

    try:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": settings.OPENWEATHERMAP_API_KEY,
            "units": "metric",
            "lang": "zh_cn",
        }

        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        return {
            "date": date.today(),
            "pressure": data.get("main", {}).get("pressure"),
            "pressure_change_24h": None,  # 单次查询无法获取变化量
            "humidity": data.get("main", {}).get("humidity"),
            "temp_high": data.get("main", {}).get("temp_max"),
            "temp_low": data.get("main", {}).get("temp_min"),
            "temp_change_24h": None,
            "wind_speed": data.get("wind", {}).get("speed"),
            "weather_condition": data.get("weather", [{}])[0].get("main"),
            "latitude": lat,
            "longitude": lon,
        }
    except httpx.HTTPError as e:
        logger.error(f"OpenWeatherMap API 调用失败: {e}")
        return _generate_mock_weather(date.today())
    except Exception as e:
        logger.error(f"获取天气数据异常: {e}")
        return None


def fetch_forecast(user: User, days: int = 7) -> List[dict]:
    """
    获取未来 N 天的天气预报

    Args:
        user: 用户对象
        days: 预报天数

    Returns:
        天气数据字典列表
    """
    if not settings.OPENWEATHERMAP_API_KEY:
        logger.warning("未配置 OPENWEATHERMAP_API_KEY，返回 mock 预报数据")
        return [_generate_mock_weather(date.today() + timedelta(days=i)) for i in range(1, days + 1)]

    lat = 21.0285
    lon = 105.8542

    try:
        url = "https://api.openweathermap.org/data/2.5/forecast"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": settings.OPENWEATHERMAP_API_KEY,
            "units": "metric",
            "lang": "zh_cn",
            "cnt": min(days * 8, 40),  # 每天 8 个数据点，最多 5 天
        }

        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        # 聚合每日数据
        daily_data = {}
        for item in data.get("list", []):
            dt = datetime.fromtimestamp(item.get("dt", 0))
            d = dt.date()
            if d <= date.today():
                continue
            if d not in daily_data:
                daily_data[d] = {
                    "date": d,
                    "pressures": [],
                    "humidities": [],
                    "temps": [],
                    "wind_speeds": [],
                    "conditions": [],
                }
            daily_data[d]["pressures"].append(item.get("main", {}).get("pressure"))
            daily_data[d]["humidities"].append(item.get("main", {}).get("humidity"))
            daily_data[d]["temps"].append(item.get("main", {}).get("temp"))
            daily_data[d]["wind_speeds"].append(item.get("wind", {}).get("speed"))
            daily_data[d]["conditions"].append(item.get("weather", [{}])[0].get("main"))

        result = []
        # 只保留需要的天数
        for d in sorted(daily_data.keys())[:days]:
            dd = daily_data[d]
            result.append({
                "date": d,
                "pressure": round(sum(dd["pressures"]) / len(dd["pressures"]), 1) if dd["pressures"] else None,
                "pressure_change_24h": None,
                "humidity": round(sum(dd["humidities"]) / len(dd["humidities"]), 1) if dd["humidities"] else None,
                "temp_high": max(dd["temps"]) if dd["temps"] else None,
                "temp_low": min(dd["temps"]) if dd["temps"] else None,
                "temp_change_24h": None,
                "wind_speed": round(sum(dd["wind_speeds"]) / len(dd["wind_speeds"]), 1) if dd["wind_speeds"] else None,
                "weather_condition": max(set(dd["conditions"]), key=dd["conditions"].count) if dd["conditions"] else None,
                "latitude": lat,
                "longitude": lon,
            })

        return result

    except Exception as e:
        logger.error(f"获取预报数据失败: {e}")
        return [_generate_mock_weather(date.today() + timedelta(days=i)) for i in range(1, min(days, 5) + 1)]
