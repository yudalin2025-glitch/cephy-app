"""
订阅管理路由模块
- GET  /api/v1/subscription/status   — 查询当前订阅状态
- POST /api/v1/subscription/webhook  — RevenueCat webhook 接收
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.deps import get_db, get_current_user
from app.models import User, Subscription
from app.schemas import SubscriptionResponse, RevenueCatWebhook

router = APIRouter(prefix="/api/v1/subscription", tags=["订阅管理"])


@router.get("/status", response_model=SubscriptionResponse, summary="查询订阅状态")
def get_subscription_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    获取当前用户的订阅状态信息。
    包括平台、计划类型、当前周期、状态等。
    """
    subscription = (
        db.query(Subscription)
        .filter(Subscription.user_id == current_user.id)
        .first()
    )

    if not subscription:
        # 理论上注册时已自动创建，但做防御处理
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="未找到订阅信息",
        )

    return SubscriptionResponse.model_validate(subscription)


@router.post("/webhook", status_code=status.HTTP_200_OK, summary="RevenueCat webhook")
async def revenuecat_webhook(
    payload: RevenueCatWebhook,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    接收 RevenueCat 的 webhook 通知。
    处理以下事件类型：
    - INITIAL_PURCHASE / RENEWAL / TRIAL_STARTED → 更新订阅为 active
    - CANCELLATION → 更新为 cancelled
    - EXPIRATION → 更新为 expired
    - REFUND → 更新为 refunded
    """
    event = payload.event or payload.model_dump()
    if not event:
        return {"status": "ignored", "message": "空事件"}

    event_type = event.get("type") or payload.type or "UNKNOWN"

    # 从 event 中提取用户标识（RevenueCat 通过 app_user_id 关联）
    app_user_id = event.get("app_user_id") or event.get("original_app_user_id")
    if not app_user_id:
        return {"status": "ignored", "message": "缺少 app_user_id"}

    # 查找用户
    user = db.query(User).filter(User.id == app_user_id).first()
    if not user:
        return {"status": "ignored", "message": f"用户不存在: {app_user_id}"}

    # 查找或创建订阅记录
    subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    if not subscription:
        subscription = Subscription(user_id=user.id)
        db.add(subscription)

    # 根据事件类型更新状态
    event_type_upper = event_type.upper()
    if event_type_upper in ("INITIAL_PURCHASE", "RENEWAL", "TRIAL_STARTED", "PURCHASE"):
        subscription.status = "active"
        subscription.platform = event.get("platform", subscription.platform)
        subscription.store_product_id = event.get("product_id", subscription.store_product_id)
        subscription.original_transaction_id = (
            event.get("original_transaction_id") or
            event.get("transaction_id") or
            subscription.original_transaction_id
        )
        # 更新周期
        from datetime import datetime
        expires_at = event.get("expiration_at_ms")
        if expires_at:
            subscription.current_period_end = datetime.fromtimestamp(expires_at / 1000.0)

        # 同时更新用户表的快捷状态
        user.subscription_status = "active"

    elif event_type_upper == "CANCELLATION":
        subscription.status = "cancelled"
        from datetime import datetime
        cancelled_at = event.get("cancelled_at_ms")
        if cancelled_at:
            subscription.cancelled_at = datetime.fromtimestamp(cancelled_at / 1000.0)

    elif event_type_upper == "EXPIRATION":
        subscription.status = "expired"
        user.subscription_status = "expired"

    elif event_type_upper == "REFUND":
        subscription.status = "refunded"
        user.subscription_status = "expired"

    else:
        # 未知事件类型，记录但不报错
        pass

    db.commit()

    return {
        "status": "processed",
        "event_type": event_type,
        "user_id": app_user_id,
    }
