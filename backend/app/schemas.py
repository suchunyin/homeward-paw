from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ═══════════════════════════════════════════
# 用户
# ═══════════════════════════════════════════

class UserRegister(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=50)
    role: str = "adopter"   # adopter / shelter / volunteer


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: str
    phone: str
    avatar: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ═══════════════════════════════════════════
# 宠物
# ═══════════════════════════════════════════

class PetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    species: str = Field(default="狗")
    breed: str = ""
    age: int = 0
    gender: str = "unknown"
    size: str = "medium"
    color: str = ""
    description: str = ""
    health_status: str = ""
    is_vaccinated: bool = False
    is_neutered: bool = False
    city: str = ""
    district: str = ""
    cover_image: str = ""
    images: str = "[]"


class PetUpdate(BaseModel):
    name: Optional[str] = None
    breed: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    size: Optional[str] = None
    description: Optional[str] = None
    health_status: Optional[str] = None
    is_vaccinated: Optional[bool] = None
    is_neutered: Optional[bool] = None
    status: Optional[str] = None
    cover_image: Optional[str] = None
    images: Optional[str] = None


class PetOut(BaseModel):
    id: int
    name: str
    species: str
    breed: str
    age: int
    gender: str
    size: str
    color: str
    description: str
    health_status: str
    is_vaccinated: bool
    is_neutered: bool
    city: str
    district: str
    cover_image: str
    images: str
    status: str
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PetListOut(BaseModel):
    items: list[PetOut]
    total: int
    page: int
    page_size: int


# ═══════════════════════════════════════════
# 领养申请
# ═══════════════════════════════════════════

class AdoptionCreate(BaseModel):
    pet_id: int
    message: str = ""


class AdoptionUpdate(BaseModel):
    status: Optional[str] = None
    reply: Optional[str] = None


class AdoptionOut(BaseModel):
    id: int
    user_id: int
    pet_id: int
    status: str
    message: str
    reply: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════
# 救助知识文章
# ═══════════════════════════════════════════

class KnowledgeCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    category: str = "care"     # care / medical / law / story
    content: str = Field(..., min_length=1)
    summary: str = ""
    cover_image: str = ""


class KnowledgeUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    cover_image: Optional[str] = None
    is_published: Optional[bool] = None


class KnowledgeOut(BaseModel):
    id: int
    title: str
    category: str
    summary: str
    cover_image: str
    author_id: int
    view_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class KnowledgeDetailOut(KnowledgeOut):
    content: str


class KnowledgeListOut(BaseModel):
    items: list[KnowledgeOut]
    total: int
    page: int
    page_size: int


# ═══════════════════════════════════════════
# 宠物日记
# ═══════════════════════════════════════════

class DiaryCreate(BaseModel):
    pet_id: int
    content: str = Field(..., min_length=1)
    images: str = "[]"
    mood: str = "happy"
    is_public: bool = True


class DiaryOut(BaseModel):
    id: int
    pet_id: int
    author_id: int
    content: str
    images: str
    mood: str
    is_public: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DiaryListOut(BaseModel):
    items: list[DiaryOut]
    total: int
    page: int
    page_size: int


# ═══════════════════════════════════════════
# 健康档案
# ═══════════════════════════════════════════

class HealthRecordCreate(BaseModel):
    pet_id: int
    record_type: str           # vaccine / deworming / checkup / medical
    title: str = Field(..., min_length=1, max_length=100)
    description: str = ""
    vet_name: str = ""
    vet_clinic: str = ""
    record_date: datetime
    next_date: Optional[datetime] = None
    attachments: str = "[]"


class HealthRecordOut(BaseModel):
    id: int
    pet_id: int
    record_type: str
    title: str
    description: str
    vet_name: str
    vet_clinic: str
    record_date: datetime
    next_date: Optional[datetime] = None
    attachments: str
    created_at: datetime

    class Config:
        from_attributes = True


class HealthRecordListOut(BaseModel):
    items: list[HealthRecordOut]
    total: int
    page: int
    page_size: int


# ═══════════════════════════════════════════
# 云养宠
# ═══════════════════════════════════════════

class CloudAdoptionCreate(BaseModel):
    pet_id: int
    monthly_amount: float = 0.0
    message: str = ""


class CloudAdoptionOut(BaseModel):
    id: int
    user_id: int
    pet_id: int
    status: str
    monthly_amount: float
    message: str
    created_at: datetime

    class Config:
        from_attributes = True


class CloudAdoptionListOut(BaseModel):
    items: list[CloudAdoptionOut]
    total: int


# ═══════════════════════════════════════════
# 捐赠
# ═══════════════════════════════════════════

class DonationCreate(BaseModel):
    pet_id: Optional[int] = None
    donation_type: str = "cash"        # cash / goods
    amount: float = 0.0
    goods_name: str = ""
    goods_quantity: int = 1
    message: str = ""
    is_anonymous: bool = False


class DonationUpdate(BaseModel):
    is_verified: Optional[bool] = None


class DonationOut(BaseModel):
    id: int
    user_id: int
    pet_id: Optional[int] = None
    donation_type: str
    amount: float
    goods_name: str
    goods_quantity: int
    message: str
    is_anonymous: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DonationListOut(BaseModel):
    items: list[DonationOut]
    total: int
    page: int
    page_size: int


# ═══════════════════════════════════════════
# 活动
# ═══════════════════════════════════════════

class ActivityCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: str = ""
    cover_image: str = ""
    location: str = ""
    start_time: datetime
    end_time: datetime
    max_participants: int = 20


class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    location: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    max_participants: Optional[int] = None
    status: Optional[str] = None


class ActivityOut(BaseModel):
    id: int
    title: str
    description: str
    cover_image: str
    location: str
    start_time: datetime
    end_time: datetime
    max_participants: int
    status: str
    organizer_id: int
    enrolled_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityListOut(BaseModel):
    items: list[ActivityOut]
    total: int
    page: int
    page_size: int


class EnrollmentCreate(BaseModel):
    activity_id: int
    note: str = ""


class EnrollmentOut(BaseModel):
    id: int
    activity_id: int
    user_id: int
    is_checked_in: bool
    checked_in_at: Optional[datetime] = None
    note: str
    created_at: datetime

    class Config:
        from_attributes = True
