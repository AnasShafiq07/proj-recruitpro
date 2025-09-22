from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class PaymentBase(BaseModel):
    job_id: int
    amount: Optional[float] = None
    status: Optional[str] = "Pending"


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    status: Optional[str] = None


class PaymentOut(PaymentBase):
    payment_id: int
    payment_date: datetime

    class Config:
        from_attributes = True
