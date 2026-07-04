"""
偏头痛发作 CRUD 路由
- GET    /api/v1/attacks      — 分页获取发作列表
- GET    /api/v1/attacks/{id} — 获取单次发作详情
- POST   /api/v1/attacks      — 创建手动记录
- PATCH  /api/v1/attacks/{id} — 更新记录
- DELETE /api/v1/attacks/{id} — 删除记录
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from app.deps import get_db, get_current_user
from app.models import User, MigraineAttack, AttackSymptom, AttackTrigger, Medication
from app.schemas import (
    AttackCreate, AttackUpdate, AttackResponse, AttackListResponse,
    SymptomCreate, TriggerCreate, MedicationCreate,
)

router = APIRouter(prefix="/api/v1/attacks", tags=["偏头痛发作"])


def _build_attack_response(attack: MigraineAttack) -> AttackResponse:
    """将 ORM 模型转换为响应 Schema"""
    return AttackResponse(
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
        source=attack.source or "manual",
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
        medications=[{"id": m.id, "name": m.name, "dosage": m.dosage,
                      "effectiveness": m.effectiveness, "taken_at": m.taken_at, "notes": m.notes}
                     for m in (attack.medications or [])],
    )


@router.get("", response_model=AttackListResponse, summary="获取发作列表（分页）")
def list_attacks(
    page: int = Query(1, ge=1, description="页码"),
    per_page: int = Query(20, ge=1, le=100, description="每页数量"),
    days: Optional[int] = Query(None, ge=1, description="最近 N 天过滤"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    分页获取当前用户的偏头痛发作记录。
    支持按时间范围筛选（days 参数）。
    """
    query = db.query(MigraineAttack).filter(
        MigraineAttack.user_id == current_user.id
    )

    # 按天数过滤
    if days is not None:
        cutoff = datetime.utcnow() - timedelta(days=days)
        query = query.filter(MigraineAttack.started_at >= cutoff)

    # 总数
    total = query.count()

    # 分页（按开始时间倒序）
    items = (
        query
        .options(
            joinedload(MigraineAttack.symptoms),
            joinedload(MigraineAttack.triggers),
            joinedload(MigraineAttack.medications),
        )
        .order_by(desc(MigraineAttack.started_at))
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return AttackListResponse(
        items=[_build_attack_response(a) for a in items],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{attack_id}", response_model=AttackResponse, summary="获取单次发作详情")
def get_attack(
    attack_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """获取指定发作记录的完整详情（含症状、诱因、用药）"""
    attack = (
        db.query(MigraineAttack)
        .options(
            joinedload(MigraineAttack.symptoms),
            joinedload(MigraineAttack.triggers),
            joinedload(MigraineAttack.medications),
        )
        .filter(
            MigraineAttack.id == attack_id,
            MigraineAttack.user_id == current_user.id,
        )
        .first()
    )
    if not attack:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="发作记录不存在")

    return _build_attack_response(attack)


@router.post("", response_model=AttackResponse, status_code=status.HTTP_201_CREATED, summary="创建发作记录")
def create_attack(
    req: AttackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """手动创建偏头痛发作记录（可附带症状、诱因、用药）"""
    # 创建主记录
    attack = MigraineAttack(
        user_id=current_user.id,
        started_at=req.started_at,
        ended_at=req.ended_at,
        severity_score=req.severity_score,
        pain_locations=req.pain_locations or [],
        pain_type=req.pain_type,
        prodrome_symptoms=req.prodrome_symptoms or [],
        missed_work=req.missed_work,
        source="manual",
        notes=req.notes,
        timezone_offset=req.timezone_offset,
    )

    # 计算持续时间（如果提供了 started_at 和 ended_at）
    if req.started_at and req.ended_at:
        delta = req.ended_at - req.started_at
        attack.duration_minutes = int(delta.total_seconds() // 60)

    db.add(attack)
    db.flush()  # 获取 attack.id

    # 附加症状
    for s in (req.symptoms or []):
        symptom = AttackSymptom(
            attack_id=attack.id,
            symptom_type=s.symptom_type,
            severity=s.severity,
        )
        db.add(symptom)

    # 附加诱因
    for t in (req.triggers or []):
        trigger = AttackTrigger(
            attack_id=attack.id,
            trigger_type=t.trigger_type,
            confidence=t.confidence,
        )
        db.add(trigger)

    # 附加用药
    for m in (req.medications or []):
        med = Medication(
            user_id=current_user.id,
            attack_id=attack.id,
            name=m.name,
            dosage=m.dosage,
            effectiveness=m.effectiveness,
            taken_at=m.taken_at or datetime.utcnow(),
            notes=m.notes,
        )
        db.add(med)

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

    return _build_attack_response(attack)


@router.patch("/{attack_id}", response_model=AttackResponse, summary="更新发作记录")
def update_attack(
    attack_id: str,
    req: AttackUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新指定发作记录的字段"""
    attack = (
        db.query(MigraineAttack)
        .filter(
            MigraineAttack.id == attack_id,
            MigraineAttack.user_id == current_user.id,
        )
        .first()
    )
    if not attack:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="发作记录不存在")

    # 逐个更新提供的字段
    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(attack, field, value)

    # 重新计算持续时间
    if attack.started_at and attack.ended_at:
        delta = attack.ended_at - attack.started_at
        attack.duration_minutes = int(delta.total_seconds() // 60)

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

    return _build_attack_response(attack)


@router.delete("/{attack_id}", status_code=status.HTTP_204_NO_CONTENT, summary="删除发作记录")
def delete_attack(
    attack_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """删除指定的发作记录（关联的 symptoms / triggers / medications 自动级联删除）"""
    attack = (
        db.query(MigraineAttack)
        .filter(
            MigraineAttack.id == attack_id,
            MigraineAttack.user_id == current_user.id,
        )
        .first()
    )
    if not attack:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="发作记录不存在")

    db.delete(attack)
    db.commit()
