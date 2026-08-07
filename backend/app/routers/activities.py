"""志愿活动相关路由"""

import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user, require_roles
from app.database import get_db
from app.models import Activity, ActivityEnrollment, OperationLog, User
from app.schemas import (
    ActivityCreate,
    ActivityEnrollmentDetailOut,
    ActivityListOut,
    ActivityManageListOut,
    ActivityManageOut,
    ActivityOut,
    ActivityUpdate,
    EnrollmentOut,
)

router = APIRouter(prefix="/api/activities", tags=["志愿活动"])


async def _log_op(
    db: AsyncSession,
    user: User,
    action: str,
    target_type: str,
    target_id: int,
    target_title: str,
    details: str | None = None,
):
    log = OperationLog(
        user_id=user.id,
        user_name=user.username,
        action=action,
        target_type=target_type,
        target_id=target_id,
        target_title=target_title,
        details=details,
    )
    db.add(log)
    await db.commit()


# ── 公开接口 ──


@router.get("", response_model=ActivityListOut)
async def list_activities(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    status_filter: str | None = Query(None, alias="status"),
    keyword: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """公开活动列表"""
    base_q = select(Activity)
    count_q = select(func.count(Activity.id))

    if status_filter:
        base_q = base_q.where(Activity.status == status_filter)
        count_q = count_q.where(Activity.status == status_filter)
    if keyword:
        base_q = base_q.where(Activity.title.ilike(f"%{keyword}%"))
        count_q = count_q.where(Activity.title.ilike(f"%{keyword}%"))

    total = (await db.execute(count_q)).scalar() or 0
    base_q = base_q.order_by(desc(Activity.created_at))
    base_q = base_q.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(base_q)
    items = result.scalars().all()

    return ActivityListOut(
        items=[ActivityOut.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{activity_id}", response_model=ActivityOut)
async def get_activity(
    activity_id: int,
    db: AsyncSession = Depends(get_db),
):
    """获取活动详情"""
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="活动不存在")
    return activity


# ── 管理端接口 ──


@router.get("/manage/list", response_model=ActivityManageListOut)
async def manage_list_activities(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    status_filter: str | None = Query(None, alias="status"),
    keyword: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    管理端活动列表（需登录）
    - 管理员：看到所有 + 报名详情
    - 救助站：只能看到自己创建的 + 报名详情
    - 普通用户：看到所有活动但不含报名详情
    """
    base_q = select(Activity)
    count_q = select(func.count(Activity.id))

    if current_user.role == "shelter":
        base_q = base_q.where(Activity.organizer_id == current_user.id)
        count_q = count_q.where(Activity.organizer_id == current_user.id)
    if status_filter:
        base_q = base_q.where(Activity.status == status_filter)
        count_q = count_q.where(Activity.status == status_filter)
    if keyword:
        base_q = base_q.where(Activity.title.ilike(f"%{keyword}%"))
        count_q = count_q.where(Activity.title.ilike(f"%{keyword}%"))

    total = (await db.execute(count_q)).scalar() or 0
    base_q = base_q.order_by(desc(Activity.created_at))
    base_q = base_q.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(base_q)
    items = result.scalars().all()

    # 批量查报名信息（仅管理员/救助站可见）
    activity_ids = [item.id for item in items]
    enrollments_map: dict[int, list[ActivityEnrollmentDetailOut]] = {}

    if current_user.role in ("admin", "shelter"):
        enrollments_map = await _fetch_enrollments(db, activity_ids)

    return ActivityManageListOut(
        items=[
            ActivityManageOut(
                id=item.id,
                title=item.title,
                description=item.description,
                cover_image=item.cover_image,
                location=item.location,
                start_time=item.start_time,
                end_time=item.end_time,
                max_participants=item.max_participants,
                status=item.status,
                organizer_id=item.organizer_id,
                enrolled_count=len(enrollments_map.get(item.id, [])),
                created_at=item.created_at,
                enrollments=enrollments_map.get(item.id, []),
            )
            for item in items
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


async def _fetch_enrollments(
    db: AsyncSession, activity_ids: list[int]
) -> dict[int, list[ActivityEnrollmentDetailOut]]:
    """提取为独立函数以复用"""
    enrollments_map: dict[int, list[ActivityEnrollmentDetailOut]] = {}
    if not activity_ids:
        return enrollments_map
    enrollments_result = await db.execute(
        select(ActivityEnrollment, User.username, User.email)
        .join(User, ActivityEnrollment.user_id == User.id)
        .where(ActivityEnrollment.activity_id.in_(activity_ids))
        .order_by(ActivityEnrollment.created_at)
    )
    for enrollment, username, email in enrollments_result.all():
        detail = ActivityEnrollmentDetailOut(
            id=enrollment.id,
            user_id=enrollment.user_id,
            user_name=username,
            user_email=email,
            is_checked_in=enrollment.is_checked_in,
            checked_in_at=enrollment.checked_in_at,
            note=enrollment.note,
            created_at=enrollment.created_at,
        )
        enrollments_map.setdefault(enrollment.activity_id, []).append(detail)
    return enrollments_map


@router.get("/manage/{activity_id}", response_model=ActivityManageOut)
async def manage_get_activity(
    activity_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """管理端获取活动详情（需登录）
    - 管理员/救助站：包含报名列表
    - 普通用户：不含报名数据
    """
    q = select(Activity).where(Activity.id == activity_id)
    if current_user.role == "shelter":
        q = q.where(Activity.organizer_id == current_user.id)

    result = await db.execute(q)
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="活动不存在")

    # 查报名（仅管理员/救助站可见）
    enrollment_details: list = []
    if current_user.role in ("admin", "shelter"):
        enrollments_map = await _fetch_enrollments(db, [activity_id])
        enrollment_details = enrollments_map.get(activity_id, [])

    return ActivityManageOut(
        id=activity.id,
        title=activity.title,
        description=activity.description,
        cover_image=activity.cover_image,
        location=activity.location,
        start_time=activity.start_time,
        end_time=activity.end_time,
        max_participants=activity.max_participants,
        status=activity.status,
        organizer_id=activity.organizer_id,
        enrolled_count=len(enrollment_details),
        created_at=activity.created_at,
        enrollments=enrollment_details,
    )


@router.get("/manage/{activity_id}/enrollments", response_model=list[ActivityEnrollmentDetailOut])
async def get_activity_enrollments(
    activity_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "shelter"])),
):
    """获取活动报名列表"""
    q = select(Activity).where(Activity.id == activity_id)
    if current_user.role == "shelter":
        q = q.where(Activity.organizer_id == current_user.id)

    result = await db.execute(q)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="活动不存在")

    enrollments_result = await db.execute(
        select(ActivityEnrollment, User.username, User.email)
        .join(User, ActivityEnrollment.user_id == User.id)
        .where(ActivityEnrollment.activity_id == activity_id)
        .order_by(ActivityEnrollment.created_at)
    )
    return [
        ActivityEnrollmentDetailOut(
            id=e.id,
            user_id=e.user_id,
            user_name=username,
            user_email=email,
            is_checked_in=e.is_checked_in,
            checked_in_at=e.checked_in_at,
            note=e.note,
            created_at=e.created_at,
        )
        for e, username, email in enrollments_result.all()
    ]


@router.post("", response_model=ActivityOut, status_code=status.HTTP_201_CREATED)
async def create_activity(
    data: ActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "shelter"])),
):
    """创建活动"""
    # 自动设置初始状态
    now = dt.datetime.now(dt.timezone.utc)
    if data.start_time <= now:
        initial_status = "ongoing"
    else:
        initial_status = "upcoming"

    activity = Activity(
        title=data.title,
        description=data.description,
        cover_image=data.cover_image,
        location=data.location,
        start_time=data.start_time,
        end_time=data.end_time,
        max_participants=data.max_participants,
        status=initial_status,
        organizer_id=current_user.id,
    )
    db.add(activity)
    await db.commit()
    await db.refresh(activity)

    await _log_op(db, current_user, "create", "activity", activity.id, activity.title)
    return activity


@router.put("/{activity_id}", response_model=ActivityOut)
async def update_activity(
    activity_id: int,
    data: ActivityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "shelter"])),
):
    """编辑活动"""
    q = select(Activity).where(Activity.id == activity_id)
    if current_user.role == "shelter":
        q = q.where(Activity.organizer_id == current_user.id)

    result = await db.execute(q)
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="活动不存在")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(activity, field, value)

    db.add(activity)
    await db.commit()
    await db.refresh(activity)

    await _log_op(db, current_user, "update", "activity", activity.id, activity.title)
    return activity


@router.put("/{activity_id}/status", response_model=ActivityOut)
async def update_activity_status(
    activity_id: int,
    status_value: str = Query(..., regex="^(upcoming|ongoing|completed)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "shelter"])),
):
    """手动切换活动状态"""
    q = select(Activity).where(Activity.id == activity_id)
    if current_user.role == "shelter":
        q = q.where(Activity.organizer_id == current_user.id)

    result = await db.execute(q)
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="活动不存在")

    old_status = activity.status
    activity.status = status_value
    db.add(activity)
    await db.commit()
    await db.refresh(activity)

    await _log_op(
        db,
        current_user,
        "update",
        "activity",
        activity.id,
        activity.title,
        f"status: {old_status} -> {status_value}",
    )
    return activity


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(
    activity_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "shelter"])),
):
    """删除活动"""
    q = select(Activity).where(Activity.id == activity_id)
    if current_user.role == "shelter":
        q = q.where(Activity.organizer_id == current_user.id)

    result = await db.execute(q)
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="活动不存在")

    # 清空关联报名
    await db.execute(select(ActivityEnrollment).where(ActivityEnrollment.activity_id == activity_id))
    enrollments = (
        (await db.execute(select(ActivityEnrollment).where(ActivityEnrollment.activity_id == activity_id)))
        .scalars()
        .all()
    )
    for e in enrollments:
        await db.delete(e)

    title = activity.title
    await db.delete(activity)
    await db.commit()

    await _log_op(db, current_user, "delete", "activity", activity_id, title)


# ── 报名 & 签到（志愿者） ──


@router.post("/{activity_id}/enroll", response_model=EnrollmentOut)
async def enroll_activity(
    activity_id: int,
    note: str = Query(""),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["volunteer"])),
):
    """志愿者报名活动"""
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="活动不存在")
    if activity.status != "upcoming":
        raise HTTPException(status_code=400, detail="活动不在招募中")

    # 检查已报名人数
    enrolled = (
        await db.execute(
            select(func.count(ActivityEnrollment.id)).where(ActivityEnrollment.activity_id == activity_id)
        )
    ).scalar() or 0
    if enrolled >= activity.max_participants:
        raise HTTPException(status_code=400, detail="报名已满")

    # 检查是否已报名
    existing = (
        await db.execute(
            select(ActivityEnrollment).where(
                and_(
                    ActivityEnrollment.activity_id == activity_id,
                    ActivityEnrollment.user_id == current_user.id,
                )
            )
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="您已报名该活动")

    enrollment = ActivityEnrollment(
        activity_id=activity_id,
        user_id=current_user.id,
        note=note,
    )
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)

    # 更新 enrolled_count
    activity.enrolled_count = enrolled + 1
    db.add(activity)
    await db.commit()
    return enrollment


@router.post("/{activity_id}/checkin", response_model=EnrollmentOut)
async def checkin_activity(
    activity_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["volunteer"])),
):
    """志愿者活动签到"""
    result = await db.execute(
        select(ActivityEnrollment).where(
            and_(
                ActivityEnrollment.activity_id == activity_id,
                ActivityEnrollment.user_id == current_user.id,
            )
        )
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(status_code=404, detail="您尚未报名该活动")

    if enrollment.is_checked_in:
        raise HTTPException(status_code=400, detail="您已签到")

    enrollment.is_checked_in = True
    enrollment.checked_in_at = dt.datetime.now(dt.timezone.utc)
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    return enrollment
