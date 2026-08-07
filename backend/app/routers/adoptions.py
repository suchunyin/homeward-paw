from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_user
from app.database import get_db
from app.models import Adoption, AdoptionStatus, Pet, PetStatus, User
from app.schemas import AdoptionCheckOut, AdoptionCreate, AdoptionOut, AdoptionUpdate, AdoptionWithPetOut

router = APIRouter(prefix="/api/adoptions", tags=["领养申请"])


@router.get("/check/{pet_id}", response_model=AdoptionCheckOut)
async def check_application(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """检查当前用户是否已对某宠物提交过领养申请（排除已取消的）"""
    result = await db.execute(
        select(Adoption)
        .where(
            Adoption.user_id == current_user.id,
            Adoption.pet_id == pet_id,
            Adoption.status != AdoptionStatus.CANCELLED,
        )
        .order_by(Adoption.created_at.desc())
    )
    adoption = result.scalars().first()
    if adoption:
        return AdoptionCheckOut(has_applied=True, application=AdoptionOut.model_validate(adoption))
    return AdoptionCheckOut(has_applied=False, application=None)


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

    adoption = Adoption(
        user_id=current_user.id,
        pet_id=data.pet_id,
        message=data.message,
        real_name=data.real_name,
        phone=data.phone,
        housing_type=data.housing_type,
        has_sealed_window=data.has_sealed_window,
        family_agree=data.family_agree,
        family_allergy=data.family_allergy,
        pet_experience=data.pet_experience,
        reason=data.reason,
        agree_terms=data.agree_terms,
        agree_follow_up=data.agree_follow_up,
    )
    db.add(adoption)
    await db.commit()
    await db.refresh(adoption)
    return AdoptionOut.model_validate(adoption)


def _to_adoption_with_pet_out(adoption: Adoption) -> AdoptionWithPetOut:
    """将 Adoption 对象转换为 AdoptionWithPetOut，自动附带宠物和申请人信息"""
    pet = adoption.pet
    applicant = adoption.applicant
    return AdoptionWithPetOut(
        **AdoptionOut.model_validate(adoption).model_dump(),
        pet_name=pet.name if pet else "",
        pet_breed=pet.breed if pet else "",
        pet_cover_image=pet.cover_image if pet else "",
        applicant_name=applicant.username if applicant else "",
        applicant_phone=applicant.phone if applicant and applicant.phone else "",
    )


@router.get("", response_model=list[AdoptionWithPetOut])
async def list_my_applications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Adoption)
        .options(selectinload(Adoption.pet))
        .where(Adoption.user_id == current_user.id)
        .order_by(Adoption.created_at.desc())
    )
    applications = result.scalars().all()
    return [_to_adoption_with_pet_out(a) for a in applications]


@router.get("/received", response_model=list[AdoptionWithPetOut])
async def list_received_applications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """救助站/管理员查看收到的领养申请"""
    if current_user.role == "admin":
        # 管理员可以看到所有申请
        result = await db.execute(
            select(Adoption)
            .options(selectinload(Adoption.pet), selectinload(Adoption.applicant))
            .order_by(Adoption.created_at.desc())
        )
    else:
        # 救助站只能看到自己发布宠物的申请
        result = await db.execute(
            select(Adoption)
            .options(selectinload(Adoption.pet), selectinload(Adoption.applicant))
            .join(Pet)
            .where(Pet.owner_id == current_user.id)
            .order_by(Adoption.created_at.desc())
        )
    applications = result.scalars().all()
    return [_to_adoption_with_pet_out(a) for a in applications]


@router.put("/{adoption_id}", response_model=AdoptionOut)
async def update_application(
    adoption_id: int,
    data: AdoptionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Adoption).options(selectinload(Adoption.pet)).where(Adoption.id == adoption_id)
    )
    adoption = result.scalar_one_or_none()
    if not adoption:
        raise HTTPException(status_code=404, detail="申请不存在")

    # 发布者或管理员可以审核
    if adoption.pet.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="无权审核此申请")

    if data.status:
        adoption.status = data.status
        # 如果审批通过，更新宠物状态
        if data.status == AdoptionStatus.APPROVED.value:
            adoption.pet.status = PetStatus.ADOPTED
    if data.reply is not None:
        adoption.reply = data.reply

    await db.commit()
    await db.refresh(adoption)
    return AdoptionOut.model_validate(adoption)
