import enum
import uuid

from sqlalchemy import Column, String, Enum, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class EnrollmentStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("student_id", "course_id", name="uq_student_course"),)

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False)
    status = Column(Enum(EnrollmentStatus), default=EnrollmentStatus.pending, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
    payment = relationship("Payment", back_populates="enrollment", uselist=False, cascade="all, delete-orphan")
