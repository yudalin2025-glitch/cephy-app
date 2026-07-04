"""
Pydantic 请求/响应模型
用于请求体验证和响应序列化
"""

from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ==================== 认证 ====================

class RegisterRequest(BaseModel):
    """邮箱注册请求"""
    email: str = Field(..., example="user@example.com")
    password: str = Field(..., min_length=6, example="securePassword123")


class LoginRequest(BaseModel):
    """邮箱登录请求"""
    email: str = Field(..., example="user@example.com")
    password: str = Field(..., example="securePassword123")


class AppleLoginRequest(BaseModel):
    """Apple Sign-In 请求"""
    apple_token: str = Field(..., description="Apple Identity Token")


class TokenResponse(BaseModel):
    """JWT Token 响应"""
    access_token: str
    token_type: str = "bearer"
    user_id: str


# ==================== 用户 ====================

class UserResponse(BaseModel):
    """用户基础信息响应"""
    id: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    timezone: str = "UTC"
    birth_year: Optional[int] = None
    gender: Optional[str] = None
    diagnosis_type: Optional[str] = None
    diagnosis_year: Optional[int] = None
    onboarding_completed: bool = False
    subscription_status: str = "trial"
    is_active: bool = True
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ==================== 偏头痛发作 ====================

class SymptomCreate(BaseModel):
    """创建症状的子模型"""
    symptom_type: str = Field(..., example="nausea")
    severity: Optional[int] = Field(None, ge=1, le=10)


class SymptomResponse(BaseModel):
    """症状响应"""
    id: str
    symptom_type: str
    severity: Optional[int] = None

    model_config = {"from_attributes": True}


class TriggerCreate(BaseModel):
    """创建诱因的子模型"""
    trigger_type: str = Field(..., example="weather")
    confidence: Optional[float] = None


class TriggerResponse(BaseModel):
    """诱因响应"""
    id: str
    trigger_type: str
    confidence: Optional[float] = None

    model_config = {"from_attributes": True}


class MedicationCreate(BaseModel):
    """创建用药的子模型"""
    name: str = Field(..., example="Sumatriptan")
    dosage: Optional[str] = None
    effectiveness: Optional[int] = Field(None, ge=1, le=10)
    taken_at: Optional[datetime] = None
    notes: Optional[str] = None


class MedicationResponse(BaseModel):
    """用药响应"""
    id: str
    name: str
    dosage: Optional[str] = None
    effectiveness: Optional[int] = None
    taken_at: Optional[datetime] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


class AttackCreate(BaseModel):
    """创建发作记录请求"""
    started_at: datetime
    ended_at: Optional[datetime] = None
    severity_score: int = Field(..., ge=1, le=10)
    pain_locations: Optional[List[str]] = []
    pain_type: Optional[str] = None
    prodrome_symptoms: Optional[List[str]] = []
    missed_work: bool = False
    notes: Optional[str] = None
    timezone_offset: Optional[int] = None
    symptoms: Optional[List[SymptomCreate]] = []
    triggers: Optional[List[TriggerCreate]] = []
    medications: Optional[List[MedicationCreate]] = []


class AttackUpdate(BaseModel):
    """更新发作记录请求"""
    ended_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    severity_score: Optional[int] = Field(None, ge=1, le=10)
    pain_locations: Optional[List[str]] = None
    pain_type: Optional[str] = None
    prodrome_symptoms: Optional[List[str]] = None
    missed_work: Optional[bool] = None
    notes: Optional[str] = None
    timezone_offset: Optional[int] = None


class AttackResponse(BaseModel):
    """发作记录响应（包含关联数据）"""
    id: str
    user_id: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    severity_score: Optional[int] = None
    pain_locations: Optional[List[str]] = []
    pain_type: Optional[str] = None
    prodrome_symptoms: Optional[List[str]] = []
    missed_work: bool = False
    source: str = "manual"
    voice_recording_url: Optional[str] = None
    ai_confidence: Optional[float] = None
    ai_raw_transcript: Optional[str] = None
    notes: Optional[str] = None
    timezone_offset: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    symptoms: Optional[List[SymptomResponse]] = []
    triggers: Optional[List[TriggerResponse]] = []
    medications: Optional[List[MedicationResponse]] = []

    model_config = {"from_attributes": True}


class AttackListResponse(BaseModel):
    """发作列表分页响应"""
    items: List[AttackResponse]
    total: int
    page: int
    per_page: int


# ==================== 语音 ====================

class VoiceParseResponse(BaseModel):
    """语音解析响应"""
    attack: AttackResponse
    transcript: str
    ai_confidence: float


# ==================== 天气 ====================

class WeatherResponse(BaseModel):
    """天气数据响应"""
    date: date
    pressure: Optional[float] = None
    pressure_change_24h: Optional[float] = None
    humidity: Optional[float] = None
    temp_high: Optional[float] = None
    temp_low: Optional[float] = None
    temp_change_24h: Optional[float] = None
    wind_speed: Optional[float] = None
    weather_condition: Optional[str] = None

    model_config = {"from_attributes": True}


class ForecastResponse(BaseModel):
    """天气预报列表响应"""
    items: List[WeatherResponse]
    location: Optional[str] = None


# ==================== 风险 ====================

class RiskScoreResponse(BaseModel):
    """风险评分响应"""
    id: str
    date: date
    score: int
    level: str
    model_version: str
    factors: dict = {}

    model_config = {"from_attributes": True}


class RiskHistoryResponse(BaseModel):
    """风险历史趋势响应"""
    items: List[RiskScoreResponse]
    trend: Optional[str] = None  # improving, worsening, stable


# ==================== 报告 ====================

class ReportGenerateRequest(BaseModel):
    """生成医生报告请求"""
    date_range_start: date
    date_range_end: date


class ReportResponse(BaseModel):
    """医生报告响应"""
    id: str
    date_range_start: date
    date_range_end: date
    report_type: str
    report_data: Optional[dict] = None
    pdf_url: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ==================== 订阅 ====================

class SubscriptionResponse(BaseModel):
    """订阅信息响应"""
    id: str
    platform: str = "apple"
    status: str = "trial"
    plan_type: str = "monthly"
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class RevenueCatWebhook(BaseModel):
    """RevenueCat Webhook 接收模型"""
    event: Optional[dict] = None
    type: Optional[str] = None
    # 允许自由格式的 events 数据
    model_config = {"extra": "allow"}


# ==================== 通用 ====================

class ErrorResponse(BaseModel):
    """错误响应"""
    detail: str
