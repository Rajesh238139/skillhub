from pydantic import BaseModel


class CreateOrderRequest(BaseModel):
    course_id: str


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int  # in paise
    currency: str = "INR"
    key_id: str
    course_title: str


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class EnrollmentOut(BaseModel):
    id: str
    course_id: str
    status: str

    class Config:
        from_attributes = True
