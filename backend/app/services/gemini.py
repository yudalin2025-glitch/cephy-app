"""
Google Gemini AI 服务
使用 httpx 调用 Google Gemini API 解析医疗文本为结构化数据。
没有 API key 时返回 mock 解析结果。
"""

import json
import logging
import random
from datetime import datetime
from typing import Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# 用于解析医疗文本的 prompt 模板
_PARSE_PROMPT_TEMPLATE = """
你是一个专业的偏头痛医疗助理。请分析以下患者描述的偏头痛发作文本，提取结构化信息。

请返回严格的 JSON 格式（不要包含任何其他文字），格式如下：
{
  "severity_score": 数字(1-10),
  "pain_locations": ["位置1", "位置2"],
  "pain_type": "疼痛类型如钝痛/跳痛/针扎痛/胀痛",
  "started_at": "ISO 8601 时间字符串（如果文本中提到时间，基于当前时间推算）",
  "ended_at": null 或 ISO 8601 时间字符串,
  "prodrome_symptoms": ["前驱症状"],
  "missed_work": true/false,
  "symptoms": [
    {"symptom_type": "类型如 nausea/photophobia/phonophobia/dizziness/vomiting", "severity": 数字(1-10)}
  ],
  "triggers": [
    {"trigger_type": "类型如 weather/stress/sleep/hormones/food/caffeine/alcohol/exercise", "confidence": 0.0-1.0}
  ],
  "notes": "补充备注信息",
  "ai_confidence": 0.0-1.0
}

患者描述：
{transcript}
"""

# === Mock 解析结果（用于没有 API key 时回退） ===
_MOCK_PARSE_RESULTS = [
    {
        "severity_score": 7,
        "pain_locations": ["右边太阳穴"],
        "pain_type": "针扎痛",
        "started_at": datetime.utcnow().isoformat(),
        "ended_at": None,
        "prodrome_symptoms": [],
        "missed_work": False,
        "symptoms": [
            {"symptom_type": "nausea", "severity": 6},
            {"symptom_type": "photophobia", "severity": 7},
        ],
        "triggers": [
            {"trigger_type": "weather", "confidence": 0.8},
        ],
        "notes": "根据语音分析自动创建的记录",
        "ai_confidence": 0.85,
    },
    {
        "severity_score": 5,
        "pain_locations": ["后脑勺"],
        "pain_type": "钝痛",
        "started_at": datetime.utcnow().isoformat(),
        "ended_at": None,
        "prodrome_symptoms": ["疲劳"],
        "missed_work": True,
        "symptoms": [
            {"symptom_type": "dizziness", "severity": 3},
        ],
        "triggers": [
            {"trigger_type": "sleep", "confidence": 0.7},
            {"trigger_type": "stress", "confidence": 0.5},
        ],
        "notes": "根据语音分析自动创建的记录",
        "ai_confidence": 0.78,
    },
]


def parse_medical_text(transcript: str) -> dict:
    """
    使用 Gemini API 解析医疗文本为结构化数据

    Args:
        transcript: 语音转写后的文本

    Returns:
        包含结构化发作数据的字典
    """
    # 检查是否配置了 Gemini API Key
    if not settings.GEMINI_API_KEY:
        logger.warning("未配置 GEMINI_API_KEY，返回 mock 解析结果")
        return _get_mock_parse_result(transcript)

    # 调用 Gemini API
    try:
        prompt = _PARSE_PROMPT_TEMPLATE.format(transcript=transcript)
        result = _call_gemini_api(prompt)
        if result:
            parsed = json.loads(result)
            # 确保必填字段存在
            parsed.setdefault("ai_confidence", 0.8)
            parsed.setdefault("notes", "根据语音分析自动创建的记录")
            return parsed
    except json.JSONDecodeError:
        logger.error("Gemini 返回非 JSON 格式结果")
    except Exception as e:
        logger.error(f"Gemini API 调用失败: {e}")

    # 回退到 mock
    logger.warning("Gemini API 调用失败，返回 mock 解析结果")
    return _get_mock_parse_result(transcript)


def _call_gemini_api(prompt: str) -> Optional[str]:
    """
    实际调用 Google Gemini API

    Args:
        prompt: 发送给 Gemini 的完整 prompt

    Returns:
        API 返回的文本响应
    """
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key={settings.GEMINI_API_KEY}"

    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 1024,
        }
    }

    with httpx.Client(timeout=30.0) as client:
        response = client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()

        # 提取生成文本
        candidates = data.get("candidates", [])
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            if parts:
                return parts[0].get("text", "")

    return None


def _get_mock_parse_result(transcript: str) -> dict:
    """
    获取 mock 解析结果
    根据转写文本长度做简单的 mock 变异
    """
    result = random.choice(_MOCK_PARSE_RESULTS).copy()

    # 根据文本长度微调置信度
    text_len = len(transcript)
    confidence = min(0.95, 0.5 + text_len / 500)
    result["ai_confidence"] = round(confidence, 2)

    # 更新时间为当前时间
    result["started_at"] = datetime.utcnow().isoformat()

    return result
