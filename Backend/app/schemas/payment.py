from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class PaymentBase(BaseModel):
    job_id: int
    amount: Optional[float] = None
    status: Optional[str] = "Pending"

# 👇 used inside CandidateCreate request (no candidate_id yet)
class PaymentInCandidate(PaymentBase):
    stripe_payment_intent_id: Optional[str] = None

# 👇 used when actually creating the payment in DB (backend assigns candidate_id)
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
