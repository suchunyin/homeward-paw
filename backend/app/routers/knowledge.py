from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.database import get_db
from app.models import KnowledgeArticle, User
from app.schemas import (
    KnowledgeCreate,
    KnowledgeDetailOut,
    KnowledgeListOut,
    KnowledgeOut,
    KnowledgeUpdate,
)

router = APIRouter(prefix="/api/knowledge", tags=["救助知识"])


@router.get("", response_model=KnowledgeListOut)
async def list_articles(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    category: str = Query("", description="分类筛选"),
    keyword: str = Query("", description="搜索标题"),
    db: AsyncSession = Depends(get_db),
):
    query = select(KnowledgeArticle).where(KnowledgeArticle.is_published)
    count_query = select(func.count(KnowledgeArticle.id)).where(
        KnowledgeArticle.is_published
    )

    if category:
        query = query.where(KnowledgeArticle.category == category)
        count_query = count_query.where(KnowledgeArticle.category == category)

    if keyword:
        query = query.where(KnowledgeArticle.title.contains(keyword))
        count_query = count_query.where(KnowledgeArticle.title.contains(keyword))

    offset = (page - 1) * page_size
    query = query.order_by(KnowledgeArticle.created_at.desc()).offset(offset).limit(page_size)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    result = await db.execute(query)
    items = result.scalars().all()

    return KnowledgeListOut(
        items=[KnowledgeOut.model_validate(a) for a in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/categories")
async def get_categories():
    """获取文章分类列表"""
    return {
        "categories": [
            {"value": "care", "label": "日常护理"},
            {"value": "medical", "label": "医疗健康"},
            {"value": "law", "label": "法规政策"},
            {"value": "story", "label": "救助故事"},
        ]
    }


@router.get("/{article_id}", response_model=KnowledgeDetailOut)
async def get_article(article_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(KnowledgeArticle).where(KnowledgeArticle.id == article_id)
    )
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="文章不存在")

    # 增加阅读量
    article.view_count += 1
    await db.commit()

    return KnowledgeDetailOut.model_validate(article)


@router.post("", response_model=KnowledgeDetailOut, status_code=status.HTTP_201_CREATED)
async def create_article(
    data: KnowledgeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    article = KnowledgeArticle(**data.model_dump(), author_id=current_user.id)
    db.add(article)
    await db.commit()
    await db.refresh(article)
    return KnowledgeDetailOut.model_validate(article)


@router.put("/{article_id}", response_model=KnowledgeDetailOut)
async def update_article(
    article_id: int,
    data: KnowledgeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeArticle).where(KnowledgeArticle.id == article_id)
    )
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="文章不存在")
    if article.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权修改此文章")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(article, key, value)
    await db.commit()
    await db.refresh(article)
    return KnowledgeDetailOut.model_validate(article)


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeArticle).where(KnowledgeArticle.id == article_id)
    )
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="文章不存在")
    if article.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权删除此文章")

    await db.delete(article)
    await db.commit()
