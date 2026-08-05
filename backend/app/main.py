from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import activities, adoptions, cloud, diaries, donations, health, knowledge, pets, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时：初始化数据库表
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


@app.get("/")
async def root():
    return {"message": "Homeward Paw API is running", "version": "0.1.0"}
