"""操作日志相关路由"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_roles
from app.database import get_db
from app.models import OperationLog, User
from app.schemas import OpLogListOut, OpLogOut

router = APIRouter(prefix="/api/operations", tags=["操作日志"])


@router.get("", response_model=OpLogListOut)
async def get_operation_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    target_type: str | None = Query(None),
    action: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"])),
):
    """管理员查看操作日志"""
    query = select(OperationLog)
    count_q = select(func.count(OperationLog.id))

    if target_type:
        query = query.where(OperationLog.target_type == target_type)
        count_q = count_q.where(OperationLog.target_type == target_type)
    if action:
        query = query.where(OperationLog.action == action)
        count_q = count_q.where(OperationLog.action == action)

    total = (await db.execute(count_q)).scalar() or 0

    query = query.order_by(desc(OperationLog.created_at))
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    items = result.scalars().all()

    return OpLogListOut(
        items=[OpLogOut.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )
