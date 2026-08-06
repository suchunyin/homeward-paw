from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import HealthRecord, User
from app.schemas import HealthRecordCreate, HealthRecordListOut, HealthRecordOut

router = APIRouter(prefix="/api/health", tags=["健康档案"])


@router.get("/pet/{pet_id}", response_model=HealthRecordListOut)
async def list_records(
    pet_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    record_type: str = Query("", description="记录类型筛选"),
    db: AsyncSession = Depends(get_db),
):
    query = select(HealthRecord).where(HealthRecord.pet_id == pet_id)
    count_query = select(func.count(HealthRecord.id)).where(HealthRecord.pet_id == pet_id)

    if record_type:
        query = query.where(HealthRecord.record_type == record_type)
        count_query = count_query.where(HealthRecord.record_type == record_type)

    offset = (page - 1) * page_size
    query = query.order_by(HealthRecord.record_date.desc()).offset(offset).limit(page_size)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    result = await db.execute(query)
    items = result.scalars().all()

    return HealthRecordListOut(
        items=[HealthRecordOut.model_validate(r) for r in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{record_id}", response_model=HealthRecordOut)
async def get_record(record_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(HealthRecord).where(HealthRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="健康记录不存在")
    return HealthRecordOut.model_validate(record)


@router.post("", response_model=HealthRecordOut, status_code=status.HTTP_201_CREATED)
async def create_record(
    data: HealthRecordCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    record = HealthRecord(**data.model_dump())
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return HealthRecordOut.model_validate(record)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(HealthRecord).where(HealthRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="健康记录不存在")

    await db.delete(record)
    await db.commit()
