import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base

# ═══════════════════════════════════════════
# 枚举
# ═══════════════════════════════════════════

class UserRole(str, enum.Enum):
    ADOPTER = "adopter"        # 领养者
    SHELTER = "shelter"         # 救助站
    VOLUNTEER = "volunteer"    # 志愿者
    ADMIN = "admin"             # 管理员


class PetStatus(str, enum.Enum):
    AVAILABLE = "available"     # 可领养
    PENDING = "pending"          # 审核中
    ADOPTED = "adopted"          # 已领养
    HIDDEN = "hidden"            # 隐藏


class PetGender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    UNKNOWN = "unknown"


class PetSize(str, enum.Enum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"


class AdoptionStatus(str, enum.Enum):
    PENDING = "pending"          # 待审核
    APPROVED = "approved"        # 已通过
    REJECTED = "rejected"        # 已拒绝
    CANCELLED = "cancelled"      # 已取消
    COMPLETED = "completed"      # 已完成


# ═══════════════════════════════════════════
# 数据模型
# ═══════════════════════════════════════════

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.ADOPTER, nullable=False)
    phone = Column(String(20), default="")
    avatar = Column(String(300), default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # 关联
    pets = relationship("Pet", back_populates="owner")
    applications = relationship("Adoption", back_populates="applicant", foreign_keys="Adoption.user_id")


class Pet(Base):
    __tablename__ = "pets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    species = Column(String(20), nullable=False, default="狗")        # 狗 / 猫 / 其他
    breed = Column(String(50), default="")                             # 品种
    age = Column(Integer, default=0)                                   # 月龄
    gender = Column(Enum(PetGender), default=PetGender.UNKNOWN)
    size = Column(Enum(PetSize), default=PetSize.MEDIUM)
    color = Column(String(30), default="")
    description = Column(Text, default="")
    health_status = Column(String(200), default="")                    # 健康状况
    is_vaccinated = Column(Boolean, default=False)
    is_neutered = Column(Boolean, default=False)

    # 位置
    city = Column(String(50), default="")
    district = Column(String(50), default="")

    # 图片
    cover_image = Column(String(300), default="")
    images = Column(Text, default="[]")                                # JSON 数组

    status = Column(Enum(PetStatus), default=PetStatus.AVAILABLE)

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # 关联
    owner = relationship("User", back_populates="pets")
    applications = relationship("Adoption", back_populates="pet")


class Adoption(Base):
    __tablename__ = "adoptions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    status = Column(Enum(AdoptionStatus), default=AdoptionStatus.PENDING)
    message = Column(Text, default="")                                  # 申请留言
    reply = Column(Text, default="")                                    # 救助站回复

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # 关联
    applicant = relationship("User", back_populates="applications", foreign_keys=[user_id])
    pet = relationship("Pet", back_populates="applications")


# ═══════════════════════════════════════════
# 第二阶段新增模型
# ═══════════════════════════════════════════

class HealthRecordType(str, enum.Enum):
    VACCINE = "vaccine"        # 疫苗
    DEWORMING = "deworming"   # 驱虫
    CHECKUP = "checkup"        # 体检
    MEDICAL = "medical"        # 病例/治疗


class DonationType(str, enum.Enum):
    CASH = "cash"              # 现金
    GOODS = "goods"            # 物资


class CloudAdoptionStatus(str, enum.Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"


class ActivityStatus(str, enum.Enum):
    UPCOMING = "upcoming"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class KnowledgeArticle(Base):
    """救助知识文章"""
    __tablename__ = "knowledge_articles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(100), nullable=False)
    category = Column(String(30), nullable=False, default="care")      # care/medical/law/story
    content = Column(Text, nullable=False)
    summary = Column(String(300), default="")
    cover_image = Column(String(300), default="")
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    view_count = Column(Integer, default=0)
    is_published = Column(Boolean, default=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    author = relationship("User")


class PetDiary(Base):
    """宠物日常日记"""
    __tablename__ = "pet_diaries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    images = Column(Text, default="[]")                                # JSON 图片数组
    mood = Column(String(20), default="happy")                         # happy/sick/playful/sleepy
    is_public = Column(Boolean, default=True)

    created_at = Column(DateTime, server_default=func.now())

    pet = relationship("Pet")
    author = relationship("User")


class HealthRecord(Base):
    """宠物健康档案"""
    __tablename__ = "health_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    record_type = Column(Enum(HealthRecordType), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text, default="")
    vet_name = Column(String(50), default="")                          # 兽医信息
    vet_clinic = Column(String(100), default="")                       # 诊所名称
    record_date = Column(DateTime, nullable=False)
    next_date = Column(DateTime, nullable=True)                        # 下次复诊/疫苗时间
    attachments = Column(Text, default="[]")                            # JSON 附件

    created_at = Column(DateTime, server_default=func.now())

    pet = relationship("Pet")


class CloudAdoption(Base):
    """云养宠关系"""
    __tablename__ = "cloud_adoptions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    status = Column(Enum(CloudAdoptionStatus), default=CloudAdoptionStatus.ACTIVE)
    monthly_amount = Column(Float, default=0.0)                        # 每月赞助金额
    message = Column(Text, default="")                                  # 寄语

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User")
    pet = relationship("Pet")


class Donation(Base):
    """捐赠记录"""
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=True)     # 可选：指定捐赠给某宠物
    donation_type = Column(Enum(DonationType), default=DonationType.CASH)
    amount = Column(Float, default=0.0)                                 # 金额（现金）
    goods_name = Column(String(100), default="")                       # 物资名称（物资）
    goods_quantity = Column(Integer, default=1)                         # 物资数量
    message = Column(Text, default="")                                  # 捐赠留言
    is_anonymous = Column(Boolean, default=False)                       # 是否匿名
    is_verified = Column(Boolean, default=False)                        # 救助站确认收到
    verified_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])
    pet = relationship("Pet")
    verifier = relationship("User", foreign_keys=[verified_by])


class Activity(Base):
    """志愿者活动"""
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, default="")
    cover_image = Column(String(300), default="")
    location = Column(String(200), default="")
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    max_participants = Column(Integer, default=20)                     # 人数上限
    status = Column(Enum(ActivityStatus), default=ActivityStatus.UPCOMING)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    organizer = relationship("User", foreign_keys=[organizer_id])


class ActivityEnrollment(Base):
    """活动报名"""
    __tablename__ = "activity_enrollments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_checked_in = Column(Boolean, default=False)                     # 是否签到
    checked_in_at = Column(DateTime, nullable=True)
    note = Column(Text, default="")

    created_at = Column(DateTime, server_default=func.now())

    activity = relationship("Activity")
    user = relationship("User")
