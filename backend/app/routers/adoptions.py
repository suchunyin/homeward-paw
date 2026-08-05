from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Adoption, AdoptionStatus, Pet, PetStatus, User
from app.schemas import AdoptionCreate, AdoptionOut, AdoptionUpdate

router = APIRouter(prefix="/api/adoptions", tags=["领养申请"])


@router.post("", response_model=AdoptionOut, status_code=status.HTTP_201_CREATED)
async def create_application(
    data: AdoptionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 检查宠物是否存在且可领养
    result = await db.execute(select(Pet).where(Pet.id == data.pet_id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="宠物不存在")
    if pet.status != PetStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="该宠物暂不可领养")
    if pet.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="不能领养自己发布的宠物")

    # 检查是否已有待审核的申请
    exist_result = await db.execute(
        select(Adoption).where(
            Adoption.user_id == current_user.id,
            Adoption.pet_id == data.pet_id,
            Adoption.status == AdoptionStatus.PENDING,
        )
    )
    if exist_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="你已提交过该宠物的领养申请")

    adoption = Adoption(user_id=current_user.id, pet_id=data.pet_id, message=data.message)
    db.add(adoption)
    await db.commit()
    await db.refresh(adoption)
    return AdoptionOut.model_validate(adoption)


@router.get("", response_model=list[AdoptionOut])
async def list_my_applications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Adoption)
        .where(Adoption.user_id == current_user.id)
        .order_by(Adoption.created_at.desc())
    )
    applications = result.scalars().all()
    return [AdoptionOut.model_validate(a) for a in applications]


@router.get("/received", response_model=list[AdoptionOut])
async def list_received_applications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """救助站查看收到的领养申请"""
    result = await db.execute(
        select(Adoption)
        .join(Pet)
        .where(Pet.owner_id == current_user.id)
        .order_by(Adoption.created_at.desc())
    )
    applications = result.scalars().all()
    return [AdoptionOut.model_validate(a) for a in applications]


@router.put("/{adoption_id}", response_model=AdoptionOut)
async def update_application(
    adoption_id: int,
    data: AdoptionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Adoption).join(Pet).where(Adoption.id == adoption_id)
    )
    adoption = result.scalar_one_or_none()
    if not adoption:
        raise HTTPException(status_code=404, detail="申请不存在")

    # 只有宠物发布者可以审核
    pet_result = await db.execute(select(Pet).where(Pet.id == adoption.pet_id))
    pet = pet_result.scalar_one()
    if pet.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权审核此申请")

    if data.status:
        adoption.status = data.status
        # 如果审批通过，更新宠物状态
        if data.status == AdoptionStatus.APPROVED.value:
            pet.status = PetStatus.ADOPTED
    if data.reply is not None:
        adoption.reply = data.reply

    await db.commit()
    await db.refresh(adoption)
    return AdoptionOut.model_validate(adoption)
