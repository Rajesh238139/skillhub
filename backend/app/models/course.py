import uuid

from sqlalchemy import Column, String, Text, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    thumbnail_emoji = Column(String(10), default="📘")
    price = Column(Numeric(10, 2), nullable=False, default=0)
    level = Column(String(20), default="Beginner")
    instructor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    instructor = relationship("User", back_populates="courses")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")
