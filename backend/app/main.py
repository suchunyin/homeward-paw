from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db
from app.routers import (
    activities,
    adoptions,
    cloud,
    diaries,
    donations,
    health,
    knowledge,
    operations,
    pets,
    upload,
    users,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时：初始化数据库表
    print("=" * 50)
    print("🔄 Homeward Paw API v0.2.0 (auth-fixed) 启动中...")
    print("=" * 50)
    await init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — 允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # React / UniApp
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件（上传的图片）
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# 注册路由
app.include_router(users.router)
app.include_router(pets.router)
app.include_router(adoptions.router)
app.include_router(knowledge.router)
app.include_router(diaries.router)
app.include_router(health.router)
app.include_router(cloud.router)
app.include_router(donations.router)
app.include_router(activities.router)
app.include_router(operations.router)
app.include_router(upload.router)


@app.get("/")
async def root():
    return {"message": "Homeward Paw API is running", "version": "0.1.0"}
