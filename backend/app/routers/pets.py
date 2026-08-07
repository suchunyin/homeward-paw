from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import Pet, PetStatus, User
from app.schemas import PetCreate, PetListOut, PetManageListOut, PetManageOut, PetOut, PetUpdate

router = APIRouter(prefix="/api/pets", tags=["宠物"])


# ── 权限校验辅助 ────────────────────────────────────
def _require_pet_admin(user: User):
    if user.role not in ("admin", "shelter"):
        raise HTTPException(status_code=403, detail="仅管理员/救助站可操作")


@router.get("", response_model=PetListOut)
async def list_pets(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    species: str = Query("", description="物种筛选"),
    status: str = Query("", description="状态筛选"),
    keyword: str = Query("", description="搜索关键词"),
    db: AsyncSession = Depends(get_db),
):
    query = select(Pet)
    count_query = select(func.count(Pet.id))

    # 默认只展示可领养的
    if status:
        query = query.where(Pet.status == status)
        count_query = count_query.where(Pet.status == status)
    else:
        query = query.where(Pet.status == PetStatus.AVAILABLE)
        count_query = count_query.where(Pet.status == PetStatus.AVAILABLE)

    if species:
        query = query.where(Pet.species == species)
        count_query = count_query.where(Pet.species == species)

    if keyword:
        query = query.where(Pet.name.contains(keyword))
        count_query = count_query.where(Pet.name.contains(keyword))

    # 分页
    offset = (page - 1) * page_size
    query = query.order_by(Pet.created_at.desc()).offset(offset).limit(page_size)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    result = await db.execute(query)
    items = result.scalars().all()

    return PetListOut(
        items=[PetOut.model_validate(p) for p in items],
        total=total,
        page=page,
        page_size=page_size,
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  管理端接口（管理员 / 救助站专用）
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@router.get("/manage/list", response_model=PetManageListOut)
async def manage_list_pets(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    species: str = Query("", description="物种筛选"),
    status: str = Query("", description="状态筛选"),
    keyword: str = Query("", description="搜索关键词"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_pet_admin(current_user)

    query = select(Pet)
    count_query = select(func.count(Pet.id))

    if species:
        query = query.where(Pet.species == species)
        count_query = count_query.where(Pet.species == species)

    if status:
        query = query.where(Pet.status == status)
        count_query = count_query.where(Pet.status == status)

    if keyword:
        query = query.where(Pet.name.contains(keyword))
        count_query = count_query.where(Pet.name.contains(keyword))

    offset = (page - 1) * page_size
    query = query.order_by(Pet.created_at.desc()).offset(offset).limit(page_size)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    result = await db.execute(query)
    pets = result.scalars().all()

    # 批量查 owner 用户名
    owner_ids = list({p.owner_id for p in pets})
    owner_map: dict[int, str] = {}
    if owner_ids:
        users_result = await db.execute(select(User.id, User.username).where(User.id.in_(owner_ids)))
        for uid, uname in users_result.all():
            owner_map[uid] = uname

    items = []
    for p in pets:
        d = PetOut.model_validate(p).model_dump()
        d["owner_name"] = owner_map.get(p.owner_id, "")
        items.append(PetManageOut(**d))

    return PetManageListOut(items=items, total=total, page=page, page_size=page_size)


@router.get("/manage/{pet_id}", response_model=PetManageOut)
async def manage_get_pet(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_pet_admin(current_user)

    result = await db.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="宠物不存在")

    owner_result = await db.execute(select(User.username).where(User.id == pet.owner_id))
    owner_name = owner_result.scalar_one_or_none() or ""

    d = PetOut.model_validate(pet).model_dump()
    d["owner_name"] = owner_name
    return PetManageOut(**d)


@router.put("/manage/{pet_id}", response_model=PetOut)
async def manage_update_pet(
    pet_id: int,
    data: PetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_pet_admin(current_user)

    result = await db.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="宠物不存在")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(pet, key, value)
    await db.commit()
    await db.refresh(pet)
    return PetOut.model_validate(pet)


@router.delete("/manage/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def manage_delete_pet(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_pet_admin(current_user)

    result = await db.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="宠物不存在")

    await db.delete(pet)
    await db.commit()


@router.put("/manage/{pet_id}/status", response_model=PetOut)
async def manage_toggle_pet_status(
    pet_id: int,
    status: str = Query("", description="新状态"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_pet_admin(current_user)

    result = await db.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="宠物不存在")

    if status not in (PetStatus.AVAILABLE, PetStatus.ADOPTED, PetStatus.DISABLED):
        raise HTTPException(status_code=400, detail="无效的状态值")

    pet.status = status
    await db.commit()
    await db.refresh(pet)
    return PetOut.model_validate(pet)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


@router.get("/{pet_id}", response_model=PetOut)
async def get_pet(pet_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="宠物不存在")
    return PetOut.model_validate(pet)


@router.post("", response_model=PetOut, status_code=status.HTTP_201_CREATED)
async def create_pet(
    data: PetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    pet = Pet(**data.model_dump(), owner_id=current_user.id)
    db.add(pet)
    await db.commit()
    await db.refresh(pet)
    return PetOut.model_validate(pet)


@router.put("/{pet_id}", response_model=PetOut)
async def update_pet(
    pet_id: int,
    data: PetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="宠物不存在")
    if pet.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权修改此宠物信息")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(pet, key, value)
    await db.commit()
    await db.refresh(pet)
    return PetOut.model_validate(pet)


@router.delete("/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pet(
    pet_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Pet).where(Pet.id == pet_id))
    pet = result.scalar_one_or_none()
    if not pet:
        raise HTTPException(status_code=404, detail="宠物不存在")
    if pet.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权删除此宠物信息")

    await db.delete(pet)
    await db.commit()
