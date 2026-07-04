"""
语音输入路由
- POST /api/v1/attacks/voice — 上传音频文件，转写并解析为结构化发作记录
"""

import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.deps import get_db, get_current_user
from app.models import User, MigraineAttack, AttackSymptom, AttackTrigger
from app.schemas import AttackResponse, VoiceParseResponse
from app.services.whisper_local import transcribe_audio
from app.services.gemini import parse_medical_text

router = APIRouter(prefix="/api/v1/attacks", tags=["语音输入"])


@router.post("/voice", response_model=VoiceParseResponse, summary="语音输入创建发作记录")
async def voice_create_attack(
    file: UploadFile = File(..., description="音频文件（支持 mp3, wav, m4a, ogg）"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    上传音频文件，自动完成以下流程：
    1. 保存音频到本地 uploads/ 目录
    2. 调用 Whisper 进行语音转文字
    3. 调用 Gemini AI 从文本中提取结构化发作数据
    4. 创建发作记录并返回
    """
    # 1. 验证文件类型
    allowed_extensions = {".mp3", ".wav", ".m4a", ".ogg", ".webm"}
    ext = os.path.splitext(file.filename or "audio.wav")[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"不支持的文件格式: {ext}，支持: {', '.join(allowed_extensions)}",
        )

    # 2. 确保 uploads 目录存在
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)

    # 3. 保存文件
    file_id = str(uuid.uuid4())
    saved_filename = f"{file_id}{ext}"
    saved_path = os.path.join(upload_dir, saved_filename)

    content = await file.read()
    with open(saved_path, "wb") as f:
        f.write(content)

    # 4. 调用 Whisper 转写
    transcript = transcribe_audio(saved_path)

    # 5. 调用 Gemini 解析医疗文本
    parsed = parse_medical_text(transcript)

    # 6. 创建发作记录
    attack = MigraineAttack(
        user_id=current_user.id,
        started_at=parsed.get("started_at", datetime.utcnow()),
        ended_at=parsed.get("ended_at"),
        severity_score=parsed.get("severity_score", 5),
        pain_locations=parsed.get("pain_locations", []),
        pain_type=parsed.get("pain_type"),
        prodrome_symptoms=parsed.get("prodrome_symptoms", []),
        missed_work=parsed.get("missed_work", False),
        source="voice",
        voice_recording_url=saved_path,
        ai_confidence=parsed.get("ai_confidence", 0.0),
        ai_raw_transcript=transcript,
        notes=parsed.get("notes"),
        timezone_offset=parsed.get("timezone_offset"),
    )
    db.add(attack)
    db.flush()

    # 附加症状
    for symptom_data in (parsed.get("symptoms") or []):
        symptom = AttackSymptom(
            attack_id=attack.id,
            symptom_type=symptom_data.get("symptom_type", "unknown"),
            severity=symptom_data.get("severity"),
        )
        db.add(symptom)

    # 附加诱因
    for trigger_data in (parsed.get("triggers") or []):
        trigger = AttackTrigger(
            attack_id=attack.id,
            trigger_type=trigger_data.get("trigger_type", "unknown"),
            confidence=trigger_data.get("confidence"),
        )
        db.add(trigger)

    db.commit()
    db.refresh(attack)

    # 重新加载关联数据
    attack = (
        db.query(MigraineAttack)
        .options(
            joinedload(MigraineAttack.symptoms),
            joinedload(MigraineAttack.triggers),
            joinedload(MigraineAttack.medications),
        )
        .filter(MigraineAttack.id == attack.id)
        .first()
    )

    attack_resp = AttackResponse(
        id=attack.id,
        user_id=attack.user_id,
        started_at=attack.started_at,
        ended_at=attack.ended_at,
        duration_minutes=attack.duration_minutes,
        severity_score=attack.severity_score,
        pain_locations=attack.pain_locations or [],
        pain_type=attack.pain_type,
        prodrome_symptoms=attack.prodrome_symptoms or [],
        missed_work=attack.missed_work or False,
        source=attack.source,
        voice_recording_url=attack.voice_recording_url,
        ai_confidence=attack.ai_confidence,
        ai_raw_transcript=attack.ai_raw_transcript,
        notes=attack.notes,
        timezone_offset=attack.timezone_offset,
        created_at=attack.created_at,
        updated_at=attack.updated_at,
        symptoms=[{"id": s.id, "symptom_type": s.symptom_type, "severity": s.severity}
                  for s in (attack.symptoms or [])],
        triggers=[{"id": t.id, "trigger_type": t.trigger_type, "confidence": t.confidence}
                  for t in (attack.triggers or [])],
        medications=[],
    )

    return VoiceParseResponse(
        attack=attack_resp,
        transcript=transcript,
        ai_confidence=parsed.get("ai_confidence", 0.0),
    )
