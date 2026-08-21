import enum
import uuid

from sqlalchemy import Column, String, Enum, DateTime, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class UserRole(str, enum.Enum):
    student = "student"
    instructor = "instructor"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(120), nullable=False)
    email = Column(String(190), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.student, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    courses = relationship("Course", back_populates="instructor", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
