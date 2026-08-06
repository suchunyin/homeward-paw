from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token, get_current_user, hash_password, require_admin, verify_password
from app.database import get_db
from app.models import User, UserRole
from app.schemas import (
    RoleInfo,
    Token,
    UserListItem,
    UserListOut,
    UserLogin,
    UserOut,
    UserRegister,
    UserUpdateRole,
)

router = APIRouter(prefix="/api/users", tags=["用户"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    # 检查用户名是否已存在
    result = await db.execute(select(User).where(User.username == data.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="用户名已被注册")

    # 检查邮箱是否已存在
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="邮箱已被注册")

    # 新注册用户默认为普通用户(adopter)，忽略前端传入的 role
    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
        role=UserRole.ADOPTER,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": user.id})
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    # 同时兼容用户名或邮箱登录
    result = await db.execute(
        select(User).where(or_(User.username == data.account, User.email == data.account))
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="账号已被禁用")

    token = create_access_token({"sub": user.id})
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


# ═══════════════════════════════════════════
# 管理员：角色权限管理
# ═══════════════════════════════════════════


@router.get("/roles", response_model=list[RoleInfo])
async def list_roles(current_user: User = Depends(get_current_user)):
    """获取所有可用角色列表"""
    roles = [
        RoleInfo(value="adopter", label="普通用户", description="浏览宠物信息、申请领养、捐赠等基础功能"),
        RoleInfo(value="volunteer", label="志愿者/义工", description="参与救助活动、协助救助站日常工作"),
        RoleInfo(value="shelter", label="救助站", description="发布宠物信息、管理领养申请、发布救助知识"),
        RoleInfo(value="admin", label="超级管理员", description="管理所有用户、分配角色权限、系统全局管理"),
    ]
    return roles


@router.get("", response_model=UserListOut)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: str | None = Query(None),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """管理员获取用户列表"""
    query = select(User)
    count_query = select(func.count(User.id))

    if role:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.offset((page - 1) * page_size).limit(page_size).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()

    return UserListOut(
        users=[UserListItem.model_validate(u) for u in users],
        total=total,
    )


@router.put("/{user_id}/role", response_model=UserOut)
async def update_user_role(
    user_id: int,
    data: UserUpdateRole,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """管理员修改用户角色"""
    # 不能修改自己的角色
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="不能修改自己的角色")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    # 验证角色值
    valid_roles = {r.value for r in UserRole}
    if data.role not in valid_roles:
        raise HTTPException(
            status_code=400, detail=f"无效的角色: {data.role}，有效值为: {', '.join(valid_roles)}"
        )

    user.role = data.role
    await db.commit()
    await db.refresh(user)

    return UserOut.model_validate(user)


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """管理员删除用户"""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="不能删除自己")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    await db.delete(user)
    await db.commit()

    return {"detail": "用户已删除"}
