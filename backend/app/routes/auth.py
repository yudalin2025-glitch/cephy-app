"""
认证路由模块
- POST /auth/register — 邮箱注册
- POST /auth/login   — 邮箱登录
- POST /auth/apple   — Apple Sign-In
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.deps import get_db
from app.models import User, Subscription, AppSetting
from app.schemas import (
    RegisterRequest, LoginRequest, AppleLoginRequest,
    TokenResponse, ErrorResponse,
)

router = APIRouter(prefix="/auth", tags=["认证"])

# 密码哈希上下文（bcrypt）
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(user_id: str) -> str:
    """
    创建 JWT access token
    :param user_id: 用户 UUID
    :returns: 编码后的 JWT 字符串
    """
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    to_encode = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.utcnow(),
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def _ensure_subscription_and_settings(user: User, db: Session) -> None:
    """
    确保新用户有默认的订阅记录和应用设置
    如果不存在则创建
    """
    existing_sub = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if existing_sub is None:
        sub = Subscription(
            user_id=user.id,
            platform="apple",
            status="trial",
            plan_type="monthly",
            current_period_start=datetime.utcnow(),
            current_period_end=datetime.utcnow() + timedelta(days=30),
        )
        db.add(sub)

    existing_setting = db.query(AppSetting).filter(AppSetting.user_id == user.id).first()
    if existing_setting is None:
        setting = AppSetting(user_id=user.id)
        db.add(setting)

    db.commit()


@router.post(
    "/register",
    response_model=TokenResponse,
    responses={409: {"model": ErrorResponse}},
    summary="邮箱注册",
)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """
    使用邮箱和密码注册新用户。
    - email 不能重复
    - 密码使用 bcrypt 哈希存储
    - 自动创建默认订阅和应用设置
    """
    # 检查邮箱是否已存在
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="该邮箱已被注册",
        )

    # 创建用户
    user = User(
        email=req.email,
        hashed_password=pwd_context.hash(req.password),
        timezone="UTC",
        subscription_status="trial",
        trial_started_at=datetime.utcnow(),
    )
    db.add(user)
    db.flush()  # 获取 user.id

    # 确保默认订阅和设置
    _ensure_subscription_and_settings(user, db)

    # 生成 token
    access_token = create_access_token(user.id)

    return TokenResponse(
        access_token=access_token,
        user_id=user.id,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    responses={401: {"model": ErrorResponse}},
    summary="邮箱登录",
)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """
    使用邮箱和密码登录。
    验证通过后返回 JWT token。
    """
    # 查找用户
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
        )

    # 验证密码
    if not pwd_context.verify(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="账户已被禁用",
        )

    # 生成 token
    access_token = create_access_token(user.id)

    return TokenResponse(
        access_token=access_token,
        user_id=user.id,
    )


@router.post(
    "/apple",
    response_model=TokenResponse,
    responses={401: {"model": ErrorResponse}},
    summary="Apple Sign-In",
)
def apple_login(req: AppleLoginRequest, db: Session = Depends(get_db)):
    """
    Apple Sign-In 验证。
    根据 apple_token 验证用户身份，如果用户不存在则自动创建。
    注意：实际生产环境中应验证 Apple Identity Token 的签名。
    """
    # TODO: 验证 Apple Identity Token（使用 apple_jwt 库验证 signature）
    # 目前简化实现：将 apple_token 作为 apple_user_id 的标识
    apple_user_id = req.apple_token

    # 查找或创建用户
    user = db.query(User).filter(User.apple_user_id == apple_user_id).first()

    if user is None:
        # 创建新用户
        user = User(
            apple_user_id=apple_user_id,
            timezone="UTC",
            subscription_status="trial",
            trial_started_at=datetime.utcnow(),
        )
        db.add(user)
        db.flush()
        _ensure_subscription_and_settings(user, db)
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="账户已被禁用",
        )

    # 生成 token
    access_token = create_access_token(user.id)

    return TokenResponse(
        access_token=access_token,
        user_id=user.id,
    )
