from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class PaymentBase(BaseModel):
    job_id: int
    amount: Optional[float] = None
    status: Optional[str] = "Pending"

class PaymentInCandidate(PaymentBase):
    stripe_payment_intent_id: Optional[str] = None

class PaymentCreate(PaymentBase):
    candidate_id: int
    stripe_payment_intent_id: Optional[str] = None

class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    status: Optional[str] = None
    stripe_payment_intent_id: Optional[str] = None

class PaymentOut(PaymentBase):
    payment_id: int
    candidate_id: int
    stripe_payment_intent_id: Optional[str] = None
    payment_date: datetime

    class Config:
        from_attributes = True
