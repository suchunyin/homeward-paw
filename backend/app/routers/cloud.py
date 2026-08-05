from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import CloudAdoption, CloudAdoptionStatus, User
from app.schemas import CloudAdoptionCreate, CloudAdoptionListOut, CloudAdoptionOut

router = APIRouter(prefix="/api/cloud", tags=["云养宠"])


@router.get("/my", response_model=CloudAdoptionListOut)
async def my_cloud_pets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """我的云养列表"""
    query = select(CloudAdoption).where(
        CloudAdoption.user_id == current_user.id,
        CloudAdoption.status == CloudAdoptionStatus.ACTIVE,
    )

    result = await db.execute(query)
    items = result.scalars().all()

    total_result = await db.execute(
        select(func.count(CloudAdoption.id)).where(
            CloudAdoption.user_id == current_user.id,
            CloudAdoption.status == CloudAdoptionStatus.ACTIVE,
        )
    )
    total = total_result.scalar() or 0

    return CloudAdoptionListOut(
        items=[CloudAdoptionOut.model_validate(c) for c in items],
        total=total,
    )


@router.get("/pet/{pet_id}", response_model=CloudAdoptionListOut)
async def pet_cloud_supporters(
    pet_id: int,
    db: AsyncSession = Depends(get_db),
):
    """某宠物当前的云养人列表"""
    query = select(CloudAdoption).where(
        CloudAdoption.pet_id == pet_id,
        CloudAdoption.status == CloudAdoptionStatus.ACTIVE,
    )

    result = await db.execute(query)
    items = result.scalars().all()

    total_result = await db.execute(
        select(func.count(CloudAdoption.id)).where(
            CloudAdoption.pet_id == pet_id,
            CloudAdoption.status == CloudAdoptionStatus.ACTIVE,
        )
    )
    total = total_result.scalar() or 0

    return CloudAdoptionListOut(
        items=[CloudAdoptionOut.model_validate(c) for c in items],
        total=total,
    )


@router.post("", response_model=CloudAdoptionOut, status_code=status.HTTP_201_CREATED)
async def start_cloud_adoption(
    data: CloudAdoptionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """开始云养某宠物"""
    # 检查是否已经云养了该宠物
    existing = await db.execute(
        select(CloudAdoption).where(
            CloudAdoption.user_id == current_user.id,
            CloudAdoption.pet_id == data.pet_id,
            CloudAdoption.status == CloudAdoptionStatus.ACTIVE,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="您已经在云养此宠物")

    cloud = CloudAdoption(**data.model_dump(), user_id=current_user.id)
    db.add(cloud)
    await db.commit()
    await db.refresh(cloud)
    return CloudAdoptionOut.model_validate(cloud)


@router.post("/{cloud_id}/cancel")
async def cancel_cloud_adoption(
    cloud_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """取消云养"""
    result = await db.execute(
        select(CloudAdoption).where(CloudAdoption.id == cloud_id)
    )
    cloud = result.scalar_one_or_none()
    if not cloud:
        raise HTTPException(status_code=404, detail="记录不存在")
    if cloud.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权操作")

    cloud.status = CloudAdoptionStatus.CANCELLED
    await db.commit()
    return {"message": "已取消云养"}
