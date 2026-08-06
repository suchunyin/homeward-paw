from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 创建测试种子用户
    await seed_test_users()


async def seed_test_users():
    """创建四个测试用户（仅在不存在时创建）"""
    from sqlalchemy import select

    from app.auth import hash_password
    from app.models import User, UserRole

    async with async_session() as db:
        result = await db.execute(select(User).where(User.username == "admin_test"))
        if result.scalar_one_or_none():
            return  # 已初始化

        test_users = [
            User(
                username="admin_test",
                email="admin@test.com",
                phone="13800000001",
                hashed_password=hash_password("admin123"),
                role=UserRole.ADMIN,
                is_active=True,
            ),
            User(
                username="adopter_test",
                email="user@test.com",
                phone="13800000002",
                hashed_password=hash_password("user123"),
                role=UserRole.ADOPTER,
                is_active=True,
            ),
            User(
                username="shelter_test",
                email="shelter@test.com",
                phone="13800000003",
                hashed_password=hash_password("shelter123"),
                role=UserRole.SHELTER,
                is_active=True,
            ),
            User(
                username="volunteer_test",
                email="volunteer@test.com",
                phone="13800000004",
                hashed_password=hash_password("volunteer123"),
                role=UserRole.VOLUNTEER,
                is_active=True,
            ),
        ]

        db.add_all(test_users)
        await db.commit()
        print("✅ 已创建 4 个测试用户")
