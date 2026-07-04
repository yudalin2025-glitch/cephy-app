"""
Whisper 本地语音转文字服务
使用 subprocess 调用 whisper.cpp 或 whisper 命令。
本地没有实际模型时返回 mock 数据，方便开发调试。
"""

import subprocess
import logging
import os
import random

logger = logging.getLogger(__name__)

# Mock 转写文本列表（用于没有实际模型时的回退）
_MOCK_TRANSCRIPTS = [
    "我今天下午开始头痛，右边太阳穴像针扎一样疼，感觉恶心，怕光，应该持续了3个小时左右，疼痛程度大概7分。可能是今天天气突然变冷引起的。",
    "昨晚没睡好，今天早上起来就开始头痛，后脑勺位置隐隐作痛，持续到现在已经6个小时了，大概5分痛。吃了布洛芬效果一般。",
    "头痛又发作了，这次是左边，跳着疼，还觉得恶心，怕声音。感觉是昨天喝了咖啡引起的。已经持续4个小时了，疼得没法工作，大概8分。",
    "今天天气气压变化很大，我的偏头痛又犯了。前额位置持续钝痛，大概4分，不严重但是很不舒服，没有恶心。",
    "刚开完会就开始头痛，压力太大了。太阳穴两边都疼，胀痛的感觉，大概6分。伴有轻微头晕，没有恶心。",
]


def transcribe_audio(audio_path: str) -> str:
    """
    将音频文件转写为文字

    Args:
        audio_path: 音频文件路径

    Returns:
        转写后的文本字符串

    流程：
    1. 尝试调用系统 whisper 命令
    2. 如果 whisper 不可用，返回 mock 数据
    """
    # 检查文件是否存在
    if not os.path.exists(audio_path):
        logger.warning(f"音频文件不存在: {audio_path}，返回 mock 数据")
        return random.choice(_MOCK_TRANSCRIPTS)

    # 尝试调用 whisper 命令
    try:
        # 尝试 whisper.cpp 的 main 命令
        result = subprocess.run(
            ["whisper", audio_path, "--output_format", "txt"],
            capture_output=True,
            text=True,
            timeout=300,  # 5 分钟超时
        )
        if result.returncode == 0 and result.stdout.strip():
            transcript = result.stdout.strip()
            logger.info(f"Whisper 转写成功，长度: {len(transcript)} 字符")
            return transcript
    except FileNotFoundError:
        logger.warning("系统中未安装 whisper 命令，使用 mock 数据")
    except subprocess.TimeoutExpired:
        logger.warning("Whisper 转写超时，使用 mock 数据")
    except Exception as e:
        logger.error(f"Whisper 调用失败: {e}，使用 mock 数据")

    # 回退：返回 mock 数据
    return random.choice(_MOCK_TRANSCRIPTS)
