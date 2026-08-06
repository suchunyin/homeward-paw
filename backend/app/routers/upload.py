"""文件上传路由"""

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_roles
from app.database import get_db
from app.models import User
from app.schemas import UploadOut

router = APIRouter(prefix="/api/upload", tags=["文件上传"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
MAX_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("", response_model=UploadOut)
async def upload_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "shelter"])),
):
    """上传图片（管理员/救助站）"""
    ext = os.path.splitext(file.filename or "image.png")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件格式: {ext}，仅支持: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="文件大小不能超过 5MB")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    save_name = f"{uuid.uuid4().hex}{ext}"
    save_path = UPLOAD_DIR / save_name
    save_path.write_bytes(contents)

    return UploadOut(url=f"/uploads/{save_name}", filename=save_name)
