import uuid

from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.db.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    enrollment_id = Column(String(36), ForeignKey("enrollments.id"), unique=True, nullable=False)
    razorpay_order_id = Column(String(100), unique=True, nullable=False)
    razorpay_payment_id = Column(String(100), nullable=True)
    razorpay_signature = Column(String(255), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), default="created")  # created | paid | failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    enrollment = relationship("Enrollment", back_populates="payment")
