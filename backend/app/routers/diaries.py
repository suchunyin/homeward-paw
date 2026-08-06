from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import PetDiary, User
from app.schemas import DiaryCreate, DiaryListOut, DiaryOut

router = APIRouter(prefix="/api/diaries", tags=["宠物日记"])


@router.get("", response_model=DiaryListOut)
async def list_diaries(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    pet_id: int = Query(None, description="按宠物筛选"),
    db: AsyncSession = Depends(get_db),
):
    query = select(PetDiary).where(PetDiary.is_public == True)
    count_query = select(func.count(PetDiary.id)).where(PetDiary.is_public == True)

    if pet_id:
        query = query.where(PetDiary.pet_id == pet_id)
        count_query = count_query.where(PetDiary.pet_id == pet_id)

    offset = (page - 1) * page_size
    query = query.order_by(PetDiary.created_at.desc()).offset(offset).limit(page_size)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    result = await db.execute(query)
    items = result.scalars().all()

    return DiaryListOut(
        items=[DiaryOut.model_validate(d) for d in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{diary_id}", response_model=DiaryOut)
async def get_diary(diary_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PetDiary).where(PetDiary.id == diary_id))
    diary = result.scalar_one_or_none()
    if not diary:
        raise HTTPException(status_code=404, detail="日记不存在")
    return DiaryOut.model_validate(diary)


@router.post("", response_model=DiaryOut, status_code=status.HTTP_201_CREATED)
async def create_diary(
    data: DiaryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    diary = PetDiary(**data.model_dump(), author_id=current_user.id)
    db.add(diary)
    await db.commit()
    await db.refresh(diary)
    return DiaryOut.model_validate(diary)


@router.delete("/{diary_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_diary(
    diary_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(PetDiary).where(PetDiary.id == diary_id))
    diary = result.scalar_one_or_none()
    if not diary:
        raise HTTPException(status_code=404, detail="日记不存在")
    if diary.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权删除此日记")

    await db.delete(diary)
    await db.commit()
