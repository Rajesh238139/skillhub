import hmac
import hashlib
import uuid

import razorpay
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.payment import Payment
from app.schemas.payment import CreateOrderRequest, CreateOrderResponse, VerifyPaymentRequest, EnrollmentOut
from app.deps import get_current_user

router = APIRouter(prefix="/payments", tags=["payments"])


def _razorpay_client():
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        return None
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


@router.post("/create-order", response_model=CreateOrderResponse)
def create_order(payload: CreateOrderRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id, Enrollment.course_id == course.id
    ).first()
    if existing and existing.status == EnrollmentStatus.paid:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")

    enrollment = existing or Enrollment(student_id=current_user.id, course_id=course.id)
    if not existing:
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)

    amount_paise = int(course.price * 100)
    client = _razorpay_client()

    if client:
        order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": enrollment.id,
            "payment_capture": 1,
        })
        order_id = order["id"]
    else:
        # DEMO MODE: no real Razorpay keys configured. Generates a fake order id
        # so the full flow (order -> checkout -> verify) still works end to end
        # for local demoing. Swap in real keys in .env to go live.
        order_id = f"order_demo_{uuid.uuid4().hex[:14]}"

    payment = db.query(Payment).filter(Payment.enrollment_id == enrollment.id).first()
    if payment:
        payment.razorpay_order_id = order_id
        payment.amount = course.price
        payment.status = "created"
    else:
        payment = Payment(enrollment_id=enrollment.id, razorpay_order_id=order_id, amount=course.price, status="created")
        db.add(payment)
    db.commit()

    return CreateOrderResponse(
        order_id=order_id,
        amount=amount_paise,
        key_id=settings.RAZORPAY_KEY_ID or "demo_mode",
        course_title=course.title,
    )


@router.post("/verify", response_model=EnrollmentOut)
def verify_payment(payload: VerifyPaymentRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.razorpay_order_id == payload.razorpay_order_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Order not found")

    # Idempotency: if this order was already verified & paid, just return success
    # again instead of re-processing (webhooks/clients can call this more than once).
    if payment.status == "paid":
        return EnrollmentOut.model_validate(payment.enrollment)

    # REAL Razorpay signature verification (HMAC-SHA256 of order_id|payment_id
    # signed with the account's key secret). This step must happen server-side --
    # never trust a frontend "payment succeeded" callback alone, since that
    # callback can be spoofed by a malicious client.
    client = _razorpay_client()
    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": payload.razorpay_order_id,
            "razorpay_payment_id": payload.razorpay_payment_id,
            "razorpay_signature": payload.razorpay_signature,
        })
        valid = True
    except razorpay.errors.SignatureVerificationError:
        valid = False

    if not valid:
        payment.status = "failed"
        db.commit()
        raise HTTPException(status_code=400, detail="Payment signature verification failed")

    payment.razorpay_payment_id = payload.razorpay_payment_id
    payment.razorpay_signature = payload.razorpay_signature
    payment.status = "paid"
    payment.enrollment.status = EnrollmentStatus.paid
    db.commit()
    db.refresh(payment.enrollment)

    return EnrollmentOut.model_validate(payment.enrollment)


@router.post("/demo-complete", response_model=EnrollmentOut)
def demo_complete_payment(payload: CreateOrderRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    DEMO-MODE ONLY. Lets the app be fully clickable end-to-end without a real
    Razorpay account. Only runs when no Razorpay keys are configured in .env --
    if real keys are present this route refuses, forcing the real signature-
    verification path in verify_payment() above instead.
    """
    if _razorpay_client() is not None:
        raise HTTPException(status_code=403, detail="Demo mode disabled: real Razorpay keys are configured")

    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id, Enrollment.course_id == payload.course_id
    ).first()
    if not enrollment or not enrollment.payment:
        raise HTTPException(status_code=404, detail="No pending order for this course")

    enrollment.payment.status = "paid"
    enrollment.payment.razorpay_payment_id = f"pay_demo_{uuid.uuid4().hex[:14]}"
    enrollment.status = EnrollmentStatus.paid
    db.commit()
    db.refresh(enrollment)
    return EnrollmentOut.model_validate(enrollment)


@router.get("/my-enrollments", response_model=list[EnrollmentOut])
def my_enrollments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id, Enrollment.status == EnrollmentStatus.paid
    ).all()
    return [EnrollmentOut.model_validate(e) for e in items]
