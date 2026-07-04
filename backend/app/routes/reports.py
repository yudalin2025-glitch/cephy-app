"""
医生报告路由模块
- POST /api/v1/reports/generate — 生成医生报告
"""

from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps import get_db, get_current_user
from app.models import User, MigraineAttack, AttackSymptom, AttackTrigger, Medication, DoctorReport
from app.schemas import ReportGenerateRequest, ReportResponse

router = APIRouter(prefix="/api/v1/reports", tags=["医生报告"])


@router.post("/generate", response_model=ReportResponse, summary="生成医生报告")
def generate_report(
    req: ReportGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    根据指定日期范围生成医生报告。
    报告内容包含：
    - 发作次数与频率
    - 平均严重程度
    - 常见症状分布
    - 常见诱因分布
    - 用药情况与效果
    - 漏诊工作天数
    """
    # 验证日期范围
    if req.date_range_start > req.date_range_end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="开始日期不能晚于结束日期",
        )

    if req.date_range_end - req.date_range_start > timedelta(days=365):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="报告日期范围不能超过一年",
        )

    # 查询该时间段内的发作记录
    attacks = (
        db.query(MigraineAttack)
        .filter(
            MigraineAttack.user_id == current_user.id,
            MigraineAttack.started_at >= req.date_range_start,
            MigraineAttack.started_at <= req.date_range_end + timedelta(days=1),
        )
        .order_by(MigraineAttack.started_at)
        .all()
    )

    if not attacks:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="指定日期范围内没有发作记录",
        )

    # === 统计报告数据 ===
    total_attacks = len(attacks)
    total_days = (req.date_range_end - req.date_range_start).days + 1
    severity_scores = [a.severity_score for a in attacks if a.severity_score]
    avg_severity = round(sum(severity_scores) / len(severity_scores), 1) if severity_scores else 0

    # 症状统计
    symptom_counts = {}
    for a in attacks:
        for s in (a.symptoms or []):
            symptom_counts[s.symptom_type] = symptom_counts.get(s.symptom_type, 0) + 1

    # 诱因统计
    trigger_counts = {}
    for a in attacks:
        for t in (a.triggers or []):
            trigger_counts[t.trigger_type] = trigger_counts.get(t.trigger_type, 0) + 1

    # 用药统计
    medication_usage = {}
    for a in attacks:
        for m in (a.medications or []):
            if m.name not in medication_usage:
                medication_usage[m.name] = {"count": 0, "effectiveness_sum": 0, "effectiveness_count": 0}
            medication_usage[m.name]["count"] += 1
            if m.effectiveness:
                medication_usage[m.name]["effectiveness_sum"] += m.effectiveness
                medication_usage[m.name]["effectiveness_count"] += 1

    # 计算用药平均有效度
    medication_effectiveness = {}
    for name, data in medication_usage.items():
        if data["effectiveness_count"] > 0:
            avg_eff = round(data["effectiveness_sum"] / data["effectiveness_count"], 1)
        else:
            avg_eff = None
        medication_effectiveness[name] = {
            "count": data["count"],
            "avg_effectiveness": avg_eff,
        }

    missed_work_days = sum(1 for a in attacks if a.missed_work)
    frequency_per_week = round(total_attacks / (total_days / 7), 1) if total_days > 0 else 0

    report_data = {
        "summary": {
            "total_attacks": total_attacks,
            "total_days": total_days,
            "frequency_per_week": frequency_per_week,
            "avg_severity": avg_severity,
            "missed_work_days": missed_work_days,
        },
        "symptom_distribution": dict(sorted(symptom_counts.items(), key=lambda x: -x[1])),
        "trigger_distribution": dict(sorted(trigger_counts.items(), key=lambda x: -x[1])),
        "medication_effectiveness": medication_effectiveness,
        "attack_details": [
            {
                "id": a.id,
                "date": a.started_at.isoformat() if a.started_at else None,
                "severity": a.severity_score,
                "duration_minutes": a.duration_minutes,
                "pain_locations": a.pain_locations,
                "missed_work": a.missed_work,
            }
            for a in attacks
        ],
    }

    # 创建报告记录
    report = DoctorReport(
        user_id=current_user.id,
        date_range_start=req.date_range_start,
        date_range_end=req.date_range_end,
        report_type="clinical",
        report_data=report_data,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return ReportResponse.model_validate(report)
