"""
依赖注入模块
提供 get_current_user（从 JWT Bearer token 解析当前用户）和 get_db（获取数据库 session）
"""

from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db as _get_db
from app.models import User

# Bearer token 安全方案
security = HTTPBearer()


def get_db() -> Generator:
    """获取数据库 session 的依赖注入"""
    yield from _get_db()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    从 Bearer token 中解析 JWT，返回当前用户对象
    如果 token 无效或用户不存在则抛出 401 异常
    """
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的认证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # 解码 JWT
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # 从数据库查询用户
    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception

    return user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db),
) -> User | None:
    """
    可选用户依赖 —— token 存在且有效时返回用户，否则返回 None
    用于部分公开但用户已登录时可提供更丰富数据的接口
    """
    if credentials is None:
        return None
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None
