"""
数据库 ORM 模型 —— SQLAlchemy 2.0 声明式映射
共 10 张表：
  - users            用户表
  - migraine_attacks 偏头痛发作记录（核心表）
  - attack_symptoms  发作伴随症状
  - attack_triggers  发作诱因
  - medications      用药记录
  - weather_data     天气数据
  - risk_scores      风险评分
  - doctor_reports   医生报告
  - subscriptions    订阅信息
  - app_settings     用户应用设置
"""

import uuid
from datetime import datetime, date

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Date,
    Text, ForeignKey, UniqueConstraint, JSON, func
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database import Base


# ---------- 辅助函数：生成 UUID 主键 ----------
def generate_uuid() -> str:
    """生成 UUID 字符串作为主键"""
    return str(uuid.uuid4())


# ---------- 1. users ----------
class User(Base):
    """用户表 —— 支持邮箱、Apple、Google 三种登录方式"""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=True)
    apple_user_id = Column(String(255), unique=True, nullable=True)
    google_user_id = Column(String(255), unique=True, nullable=True)
    display_name = Column(String(100), nullable=True)
    timezone = Column(String(50), default="UTC")
    birth_year = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    diagnosis_type = Column(String(20), nullable=True)  # chronic, episodic, suspected
    diagnosis_year = Column(Integer, nullable=True)
    onboarding_completed = Column(Boolean, default=False)
    subscription_status = Column(String(20), default="trial")
    subscription_expires_at = Column(DateTime, nullable=True)
    trial_started_at = Column(DateTime, default=func.now())
    hashed_password = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # 关系
    attacks = relationship("MigraineAttack", back_populates="user", lazy="dynamic")
    medications = relationship("Medication", back_populates="user", lazy="dynamic")
    weather_records = relationship("WeatherData", back_populates="user", lazy="dynamic")
    risk_scores = relationship("RiskScore", back_populates="user", lazy="dynamic")
    reports = relationship("DoctorReport", back_populates="user", lazy="dynamic")
    subscription = relationship("Subscription", back_populates="user", uselist=False)
    settings = relationship("AppSetting", back_populates="user", uselist=False)


# ---------- 2. migraine_attacks ----------
class MigraineAttack(Base):
    """偏头痛发作记录（核心表）"""
    __tablename__ = "migraine_attacks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    started_at = Column(DateTime, nullable=False, index=True)
    ended_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    severity_score = Column(Integer, nullable=False)  # 1-10
    pain_locations = Column(JSON, default=[])
    pain_type = Column(String(50), nullable=True)
    prodrome_symptoms = Column(JSON, default=[])
    missed_work = Column(Boolean, default=False)
    source = Column(String(20), default="manual")       # manual, voice, import
    voice_recording_url = Column(String(500), nullable=True)
    ai_confidence = Column(Float, nullable=True)
    ai_raw_transcript = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    timezone_offset = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now())

    # 关系
    user = relationship("User", back_populates="attacks")
    symptoms = relationship("AttackSymptom", back_populates="attack", cascade="all, delete-orphan")
    triggers = relationship("AttackTrigger", back_populates="attack", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="attack")


# ---------- 3. attack_symptoms ----------
class AttackSymptom(Base):
    """发作伴随症状"""
    __tablename__ = "attack_symptoms"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    attack_id = Column(String(36), ForeignKey("migraine_attacks.id"), nullable=False, index=True)
    symptom_type = Column(String(50), nullable=False)   # nausea, photophobia, phonophobia, dizziness, vomiting
    severity = Column(Integer, nullable=True)           # 1-10

    # 关系
    attack = relationship("MigraineAttack", back_populates="symptoms")


# ---------- 4. attack_triggers ----------
class AttackTrigger(Base):
    """发作诱因"""
    __tablename__ = "attack_triggers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    attack_id = Column(String(36), ForeignKey("migraine_attacks.id"), nullable=False, index=True)
    trigger_type = Column(String(50), nullable=False)   # weather, stress, sleep, hormones, food, caffeine, alcohol, exercise
    confidence = Column(Float, nullable=True)            # AI 推断的置信度

    # 关系
    attack = relationship("MigraineAttack", back_populates="triggers")


# ---------- 5. medications ----------
class Medication(Base):
    """用药记录"""
    __tablename__ = "medications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    attack_id = Column(String(36), ForeignKey("migraine_attacks.id"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    dosage = Column(String(50), nullable=True)
    effectiveness = Column(Integer, nullable=True)      # 1-10
    taken_at = Column(DateTime, default=func.now())
    notes = Column(Text, nullable=True)

    # 关系
    user = relationship("User", back_populates="medications")
    attack = relationship("MigraineAttack", back_populates="medications")


# ---------- 6. weather_data ----------
class WeatherData(Base):
    """天气数据"""
    __tablename__ = "weather_data"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    pressure = Column(Float, nullable=True)              # hPa
    pressure_change_24h = Column(Float, nullable=True)   # hPa 变化
    humidity = Column(Float, nullable=True)               # %
    temp_high = Column(Float, nullable=True)              # °C
    temp_low = Column(Float, nullable=True)
    temp_change_24h = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    weather_condition = Column(String(50), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=func.now())

    # 关系
    user = relationship("User", back_populates="weather_records")


# ---------- 7. risk_scores ----------
class RiskScore(Base):
    """风险评分"""
    __tablename__ = "risk_scores"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    score = Column(Integer, nullable=False)              # 0-100
    level = Column(String(10), nullable=False)           # low, medium, high
    model_version = Column(String(20), default="rule_v1")
    factors = Column(JSON, default={})                   # 各因素详细分数
    created_at = Column(DateTime, default=func.now())

    # 关系
    user = relationship("User", back_populates="risk_scores")


# ---------- 8. doctor_reports ----------
class DoctorReport(Base):
    """医生报告"""
    __tablename__ = "doctor_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    date_range_start = Column(Date, nullable=False)
    date_range_end = Column(Date, nullable=False)
    report_type = Column(String(20), default="clinical")
    pdf_url = Column(String(500), nullable=True)         # Supabase Storage URL 或本地路径
    report_data = Column(JSON, nullable=True)             # 缓存的报告数据
    created_at = Column(DateTime, default=func.now())

    # 关系
    user = relationship("User", back_populates="reports")


# ---------- 9. subscriptions ----------
class Subscription(Base):
    """订阅信息"""
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, unique=True)
    platform = Column(String(20), default="apple")
    store_product_id = Column(String(100), nullable=True)
    original_transaction_id = Column(String(255), nullable=True)
    status = Column(String(20), default="trial")         # trial, active, expired, cancelled, refunded
    plan_type = Column(String(20), default="monthly")    # monthly, yearly, lifetime
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # 关系
    user = relationship("User", back_populates="subscription")


# ---------- 10. app_settings ----------
class AppSetting(Base):
    """用户应用设置"""
    __tablename__ = "app_settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, unique=True)
    dark_mode = Column(Boolean, default=True)
    notifications_enabled = Column(Boolean, default=True)
    risk_alert_enabled = Column(Boolean, default=True)
    risk_alert_threshold = Column(Integer, default=50)   # 超过此分数推送
    voice_recording_auto_save = Column(Boolean, default=True)
    data_retention_months = Column(Integer, default=24)
    language = Column(String(10), default="en")
    share_anonymized_data = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=func.now())

    # 关系
    user = relationship("User", back_populates="settings")
