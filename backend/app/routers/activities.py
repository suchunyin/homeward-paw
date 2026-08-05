from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Activity, ActivityEnrollment, ActivityStatus, User
from app.schemas import (
    ActivityCreate,
    ActivityListOut,
    ActivityOut,
    ActivityUpdate,
    EnrollmentCreate,
    EnrollmentOut,
)

router = APIRouter(prefix="/api/activities", tags=["志愿者活动"])


def _count_enrollments(enrollment_list: list) -> int:
    return len(enrollment_list)


@router.get("", response_model=ActivityListOut)
async def list_activities(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    status: str = Query("", description="状态筛选"),
    db: AsyncSession = Depends(get_db),
):
    query = select(Activity)
    count_query = select(func.count(Activity.id))

    if status:
        query = query.where(Activity.status == status)
        count_query = count_query.where(Activity.status == status)

    offset = (page - 1) * page_size
    query = query.order_by(Activity.start_time.desc()).offset(offset).limit(page_size)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    result = await db.execute(query)
    items = result.scalars().all()

    out_items = []
    for act in items:
        # 统计报名人数
        enroll_result = await db.execute(
            select(ActivityEnrollment).where(ActivityEnrollment.activity_id == act.id)
        )
        enrollments = enroll_result.scalars().all()
        out = ActivityOut.model_validate(act)
        out.enrolled_count = len(enrollments)
        out_items.append(out)

    return ActivityListOut(
        items=out_items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{activity_id}", response_model=ActivityOut)
async def get_activity(activity_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="活动不存在")

    enroll_result = await db.execute(
        select(ActivityEnrollment).where(ActivityEnrollment.activity_id == activity_id)
    )
    enrollments = enroll_result.scalars().all()
    out = ActivityOut.model_validate(activity)
    out.enrolled_count = len(enrollments)
    return out


@router.post("", response_model=ActivityOut, status_code=status.HTTP_201_CREATED)
async def create_activity(
    data: ActivityCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """创建活动（救助站/管理员）"""
    activity = Activity(**data.model_dump(), organizer_id=current_user.id)
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    return ActivityOut.model_validate(activity)


@router.put("/{activity_id}", response_model=ActivityOut)
async def update_activity(
    activity_id: int,
    data: ActivityUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="活动不存在")
    if activity.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权修改此活动")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(activity, key, value)
    await db.commit()
    await db.refresh(activity)
    return ActivityOut.model_validate(activity)


# ═══════════════════════════════════
# 报名 & 签到
# ═══════════════════════════════════

@router.post("/{activity_id}/enroll", response_model=EnrollmentOut)
async def enroll_activity(
    activity_id: int,
    data: EnrollmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """报名活动"""
    # 检查活动是否存在
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="活动不存在")
    if activity.status not in (ActivityStatus.UPCOMING, ActivityStatus.ONGOING):
        raise HTTPException(status_code=400, detail="活动不在可报名状态")

    # 检查是否已报名
    existing = await db.execute(
        select(ActivityEnrollment).where(
            ActivityEnrollment.activity_id == activity_id,
            ActivityEnrollment.user_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="已报名此活动")

    # 检查人数上限
    count_result = await db.execute(
        select(func.count(ActivityEnrollment.id)).where(
            ActivityEnrollment.activity_id == activity_id
        )
    )
    enrolled = count_result.scalar() or 0
    if enrolled >= activity.max_participants:
        raise HTTPException(status_code=400, detail="报名人数已满")

    enrollment = ActivityEnrollment(
        activity_id=activity_id,
        user_id=current_user.id,
        note=data.note,
    )
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    return EnrollmentOut.model_validate(enrollment)


@router.post("/{activity_id}/checkin")
async def checkin_activity(
    activity_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """签到"""
    from datetime import datetime, timezone

    result = await db.execute(
        select(ActivityEnrollment).where(
            ActivityEnrollment.activity_id == activity_id,
            ActivityEnrollment.user_id == current_user.id,
        )
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="未报名此活动")

    enrollment.is_checked_in = True
    enrollment.checked_in_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "签到成功"}


@router.get("/{activity_id}/enrollments")
async def list_enrollments(
    activity_id: int,
    db: AsyncSession = Depends(get_db),
):
    """活动报名列表"""
    result = await db.execute(
        select(ActivityEnrollment).where(ActivityEnrollment.activity_id == activity_id)
    )
    items = result.scalars().all()
    return {"items": [EnrollmentOut.model_validate(e) for e in items], "total": len(items)}
