"""救助知识文章相关路由"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user, require_roles
from app.database import get_db
from app.models import KnowledgeArticle, OperationLog, User
from app.schemas import (
    KnowledgeCreate,
    KnowledgeDetailOut,
    KnowledgeListOut,
    KnowledgeManageListOut,
    KnowledgeManageOut,
    KnowledgeOut,
    KnowledgeUpdate,
)

router = APIRouter(prefix="/api/knowledge", tags=["救助知识"])

CATEGORY_LABELS = {
    "care": "宠物护理",
    "medical": "急救知识",
    "law": "法规科普",
    "story": "救助故事",
}


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


@router.get("/categories")
async def get_categories():
    """获取文章分类"""
    return [{"value": k, "label": v} for k, v in CATEGORY_LABELS.items()]


@router.get("", response_model=KnowledgeListOut)
async def list_articles(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    category: str | None = Query(None),
    keyword: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """公开文章列表（仅已发布）"""
    base_q = select(KnowledgeArticle).where(KnowledgeArticle.is_published.is_(True))
    count_q = select(func.count(KnowledgeArticle.id)).where(KnowledgeArticle.is_published.is_(True))

    if category:
        base_q = base_q.where(KnowledgeArticle.category == category)
        count_q = count_q.where(KnowledgeArticle.category == category)
    if keyword:
        kw_filter = or_(
            KnowledgeArticle.title.ilike(f"%{keyword}%"),
            KnowledgeArticle.summary.ilike(f"%{keyword}%"),
        )
        base_q = base_q.where(kw_filter)
        count_q = count_q.where(kw_filter)

    total = (await db.execute(count_q)).scalar() or 0

    base_q = base_q.order_by(desc(KnowledgeArticle.created_at))
    base_q = base_q.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(base_q)
    items = result.scalars().all()

    return KnowledgeListOut(
        items=[KnowledgeOut.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{article_id}", response_model=KnowledgeDetailOut)
async def get_article(
    article_id: int,
    db: AsyncSession = Depends(get_db),
):
    """获取文章详情（已发布）"""
    result = await db.execute(
        select(KnowledgeArticle).where(
            KnowledgeArticle.id == article_id,
            KnowledgeArticle.is_published.is_(True),
        )
    )
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="文章不存在")

    article.view_count += 1
    db.add(article)
    await db.commit()
    await db.refresh(article)

    return article


# ── 管理端接口 ──


@router.get("/manage/list", response_model=KnowledgeManageListOut)
async def manage_list_articles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    category: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    keyword: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    管理端文章列表（需登录）
    - 管理员：看到所有（含草稿）
    - 救助站：只能看到自己发布的
    - 普通用户：只能看到已发布文章
    """
    base_q = select(KnowledgeArticle)
    count_q = select(func.count(KnowledgeArticle.id))

    # 救助站只能看自己的
    if current_user.role == "shelter":
        base_q = base_q.where(KnowledgeArticle.author_id == current_user.id)
        count_q = count_q.where(KnowledgeArticle.author_id == current_user.id)
    elif current_user.role not in ("admin", "shelter"):
        # 普通用户只能看到已发布文章
        base_q = base_q.where(KnowledgeArticle.is_published.is_(True))
        count_q = count_q.where(KnowledgeArticle.is_published.is_(True))

    if category:
        base_q = base_q.where(KnowledgeArticle.category == category)
        count_q = count_q.where(KnowledgeArticle.category == category)
    if status_filter == "published":
        base_q = base_q.where(KnowledgeArticle.is_published.is_(True))
        count_q = count_q.where(KnowledgeArticle.is_published.is_(True))
    elif status_filter == "draft":
        base_q = base_q.where(KnowledgeArticle.is_published.is_(False))
        count_q = count_q.where(KnowledgeArticle.is_published.is_(False))
    if keyword:
        kw_filter = or_(
            KnowledgeArticle.title.ilike(f"%{keyword}%"),
            KnowledgeArticle.summary.ilike(f"%{keyword}%"),
        )
        base_q = base_q.where(kw_filter)
        count_q = count_q.where(kw_filter)

    total = (await db.execute(count_q)).scalar() or 0
    base_q = base_q.order_by(desc(KnowledgeArticle.updated_at))
    base_q = base_q.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(base_q)
    items = result.scalars().all()

    # 填充 author_name
    user_ids = list({item.author_id for item in items})
    if user_ids:
        users_result = await db.execute(select(User.id, User.username).where(User.id.in_(user_ids)))
        user_map = {u.id: u.username for u in users_result.all()}
    else:
        user_map = {}

    return KnowledgeManageListOut(
        items=[
            KnowledgeManageOut(
                id=item.id,
                title=item.title,
                category=item.category,
                summary=item.summary,
                cover_image=item.cover_image,
                author_id=item.author_id,
                author_name=user_map.get(item.author_id, ""),
                is_published=item.is_published,
                view_count=item.view_count,
                created_at=item.created_at,
                updated_at=item.updated_at,
            )
            for item in items
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/manage/{article_id}", response_model=KnowledgeDetailOut)
async def manage_get_article(
    article_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """管理端获取文章详情（需登录）
    - 管理员/救助站：可看所有（含自己的草稿）
    - 普通用户：只能看已发布文章
    """
    q = select(KnowledgeArticle).where(KnowledgeArticle.id == article_id)
    if current_user.role == "shelter":
        q = q.where(KnowledgeArticle.author_id == current_user.id)
    elif current_user.role not in ("admin", "shelter"):
        q = q.where(KnowledgeArticle.is_published.is_(True))

    result = await db.execute(q)
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="文章不存在")
    return article


@router.post("", response_model=KnowledgeDetailOut, status_code=status.HTTP_201_CREATED)
async def create_article(
    data: KnowledgeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "shelter"])),
):
    """创建文章（默认草稿）"""
    article = KnowledgeArticle(
        title=data.title,
        category=data.category,
        content=data.content,
        summary=data.summary,
        cover_image=data.cover_image,
        author_id=current_user.id,
        is_published=False,
    )
    db.add(article)
    await db.commit()
    await db.refresh(article)

    await _log_op(db, current_user, "create", "knowledge", article.id, article.title)
    return article


@router.put("/{article_id}", response_model=KnowledgeDetailOut)
async def update_article(
    article_id: int,
    data: KnowledgeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "shelter"])),
):
    """编辑文章"""
    q = select(KnowledgeArticle).where(KnowledgeArticle.id == article_id)
    if current_user.role == "shelter":
        q = q.where(KnowledgeArticle.author_id == current_user.id)

    result = await db.execute(q)
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="文章不存在")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(article, field, value)

    db.add(article)
    await db.commit()
    await db.refresh(article)

    await _log_op(db, current_user, "update", "knowledge", article.id, article.title)
    return article


@router.put("/{article_id}/publish", response_model=KnowledgeDetailOut)
async def toggle_publish(
    article_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "shelter"])),
):
    """切换文章发布/草稿状态"""
    q = select(KnowledgeArticle).where(KnowledgeArticle.id == article_id)
    if current_user.role == "shelter":
        q = q.where(KnowledgeArticle.author_id == current_user.id)

    result = await db.execute(q)
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="文章不存在")

    article.is_published = not article.is_published
    db.add(article)
    await db.commit()
    await db.refresh(article)

    action = "publish" if article.is_published else "unpublish"
    await _log_op(db, current_user, action, "knowledge", article.id, article.title)
    return article


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "shelter"])),
):
    """删除文章"""
    q = select(KnowledgeArticle).where(KnowledgeArticle.id == article_id)
    if current_user.role == "shelter":
        q = q.where(KnowledgeArticle.author_id == current_user.id)

    result = await db.execute(q)
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="文章不存在")

    title = article.title
    await db.delete(article)
    await db.commit()

    await _log_op(db, current_user, "delete", "knowledge", article_id, title)
