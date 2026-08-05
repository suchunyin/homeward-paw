from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Donation, User
from app.schemas import DonationCreate, DonationListOut, DonationOut, DonationUpdate

router = APIRouter(prefix="/api/donations", tags=["捐赠公示"])


@router.get("", response_model=DonationListOut)
async def list_donations(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    pet_id: int = Query(None, description="按宠物筛选"),
    db: AsyncSession = Depends(get_db),
):
    """公开捐赠公示列表（仅展示已验证的）"""
    query = select(Donation).where(Donation.is_verified == True)
    count_query = select(func.count(Donation.id)).where(Donation.is_verified == True)

    if pet_id:
        query = query.where(Donation.pet_id == pet_id)
        count_query = count_query.where(Donation.pet_id == pet_id)

    offset = (page - 1) * page_size
    query = query.order_by(Donation.created_at.desc()).offset(offset).limit(page_size)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    result = await db.execute(query)
    items = result.scalars().all()

    # 匿名用户隐藏 user_id
    out_items = []
    for d in items:
        out = DonationOut.model_validate(d)
        if d.is_anonymous:
            out.user_id = 0  # 匿名标记
        out_items.append(out)

    return DonationListOut(
        items=out_items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=DonationOut, status_code=status.HTTP_201_CREATED)
async def create_donation(
    data: DonationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """用户捐赠（现金或物资）"""
    donation = Donation(**data.model_dump(), user_id=current_user.id)
    db.add(donation)
    await db.commit()
    await db.refresh(donation)
    return DonationOut.model_validate(donation)


@router.put("/{donation_id}/verify", response_model=DonationOut)
async def verify_donation(
    donation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """救助站管理员确认收到捐赠"""
    result = await db.execute(select(Donation).where(Donation.id == donation_id))
    donation = result.scalar_one_or_none()
    if not donation:
        raise HTTPException(status_code=404, detail="捐赠记录不存在")

    donation.is_verified = True
    donation.verified_by = current_user.id
    await db.commit()
    await db.refresh(donation)
    return DonationOut.model_validate(donation)


@router.get("/my", response_model=DonationListOut)
async def my_donations(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """我的捐赠记录"""
    query = select(Donation).where(Donation.user_id == current_user.id)
    count_query = select(func.count(Donation.id)).where(Donation.user_id == current_user.id)

    offset = (page - 1) * page_size
    query = query.order_by(Donation.created_at.desc()).offset(offset).limit(page_size)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    result = await db.execute(query)
    items = result.scalars().all()

    return DonationListOut(
        items=[DonationOut.model_validate(d) for d in items],
        total=total,
        page=page,
        page_size=page_size,
    )
