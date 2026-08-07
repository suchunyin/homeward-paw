from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

# ═══════════════════════════════════════════
# 用户
# ═══════════════════════════════════════════


class UserRegister(BaseModel):
    """注册：仅需用户名、邮箱、密码，身份默认为普通用户"""

    username: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=50)


class UserLogin(BaseModel):
    """登录：支持用户名或邮箱 + 密码"""

    account: str = Field(..., min_length=1, max_length=100)
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: str
    phone: str | None = None
    avatar: str | None = None
    is_active: bool = True
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
    name: str | None = None
    species: str | None = None
    breed: str | None = None
    age: int | None = None
    gender: str | None = None
    size: str | None = None
    color: str | None = None
    description: str | None = None
    health_status: str | None = None
    is_vaccinated: bool | None = None
    is_neutered: bool | None = None
    city: str | None = None
    district: str | None = None
    status: str | None = None
    cover_image: str | None = None
    images: str | None = None


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


class PetManageOut(PetOut):
    owner_name: str = ""


class PetManageListOut(BaseModel):
    items: list[PetManageOut]
    total: int
    page: int
    page_size: int


# ═══════════════════════════════════════════
# 领养申请
# ═══════════════════════════════════════════


class AdoptionCreate(BaseModel):
    pet_id: int
    real_name: str = Field(..., min_length=1, max_length=50)
    phone: str = Field(..., min_length=1, max_length=20)
    housing_type: str = Field(..., min_length=1, max_length=20)
    has_sealed_window: bool = False
    family_agree: bool = False
    family_allergy: bool = False
    pet_experience: str = Field(..., min_length=1, max_length=20)
    reason: str = Field(..., min_length=1)
    agree_terms: bool = False
    agree_follow_up: bool = False
    message: str = ""  # 补充说明


class AdoptionUpdate(BaseModel):
    status: str | None = None
    reply: str | None = None


class AdoptionOut(BaseModel):
    id: int
    user_id: int
    pet_id: int
    status: str
    message: str
    reply: str
    real_name: str = ""
    phone: str = ""
    housing_type: str = ""
    has_sealed_window: bool = False
    family_agree: bool = False
    family_allergy: bool = False
    pet_experience: str = ""
    reason: str = ""
    agree_terms: bool = False
    agree_follow_up: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AdoptionWithPetOut(AdoptionOut):
    """带宠物信息和申请人信息的领养申请"""
    pet_name: str = ""
    pet_breed: str = ""
    pet_cover_image: str = ""
    applicant_name: str = ""
    applicant_phone: str = ""


class AdoptionCheckOut(BaseModel):
    """检查用户是否已申请某宠物"""
    has_applied: bool
    application: AdoptionOut | None = None


# ═══════════════════════════════════════════
# 宠物知识文章
# ═══════════════════════════════════════════


class KnowledgeCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    category: str = "care"  # care / medical / law / story
    content: str = Field(..., min_length=1)
    summary: str = ""
    cover_image: str = ""


class KnowledgeUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    content: str | None = None
    summary: str | None = None
    cover_image: str | None = None
    is_published: bool | None = None


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
    record_type: str  # vaccine / deworming / checkup / medical
    title: str = Field(..., min_length=1, max_length=100)
    description: str = ""
    vet_name: str = ""
    vet_clinic: str = ""
    record_date: datetime
    next_date: datetime | None = None
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
    next_date: datetime | None = None
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
    pet_id: int | None = None
    donation_type: str = "cash"  # cash / goods
    amount: float = 0.0
    goods_name: str = ""
    goods_quantity: int = 1
    message: str = ""
    is_anonymous: bool = False


class DonationUpdate(BaseModel):
    is_verified: bool | None = None


class DonationOut(BaseModel):
    id: int
    user_id: int
    pet_id: int | None = None
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
    title: str | None = None
    description: str | None = None
    cover_image: str | None = None
    location: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    max_participants: int | None = None
    status: str | None = None


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
    checked_in_at: datetime | None = None
    note: str
    created_at: datetime

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════
# 角色权限管理
# ═══════════════════════════════════════════


class RoleInfo(BaseModel):
    value: str
    label: str
    description: str


class UserUpdateRole(BaseModel):
    role: str  # adopter / admin / shelter / volunteer


class UserListItem(BaseModel):
    id: int
    username: str
    email: str
    phone: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserListOut(BaseModel):
    users: list[UserListItem]
    total: int


# ═══════════════════════════════════════════
# 操作日志
# ═══════════════════════════════════════════


class OpLogOut(BaseModel):
    id: int
    user_id: int
    user_name: str
    action: str
    target_type: str
    target_id: int
    target_title: str
    details: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class OpLogListOut(BaseModel):
    items: list[OpLogOut]
    total: int
    page: int
    page_size: int


# ═══════════════════════════════════════════
# 管理端知识文章（含发布状态、作者名）
# ═══════════════════════════════════════════


class KnowledgeManageOut(BaseModel):
    id: int
    title: str
    category: str
    summary: str
    cover_image: str
    author_id: int
    author_name: str = ""
    is_published: bool
    view_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class KnowledgeManageListOut(BaseModel):
    items: list[KnowledgeManageOut]
    total: int
    page: int
    page_size: int


# ═══════════════════════════════════════════
# 管理端活动（含报名用户详情）
# ═══════════════════════════════════════════


class ActivityEnrollmentDetailOut(BaseModel):
    id: int
    user_id: int
    user_name: str = ""
    user_email: str = ""
    is_checked_in: bool
    checked_in_at: datetime | None = None
    note: str
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityManageOut(ActivityOut):
    enrollments: list[ActivityEnrollmentDetailOut] = []


class ActivityManageListOut(BaseModel):
    items: list[ActivityManageOut]
    total: int
    page: int
    page_size: int


# ═══════════════════════════════════════════
# 文件上传
# ═══════════════════════════════════════════


class UploadOut(BaseModel):
    url: str
    filename: str
