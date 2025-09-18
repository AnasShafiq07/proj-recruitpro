from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class OfferLetterBase(BaseModel):
    application_id: int
    version_no: Optional[int] = 1
    details: Optional[str] = None
    status: Optional[str] = None


class OfferLetterCreate(OfferLetterBase):
    pass


class OfferLetterUpdate(BaseModel):
    details: Optional[str] = None
    status: Optional[str] = None


class OfferLetterOut(OfferLetterBase):
    offer_id: int
    created_at: datetime

    class Config:
        from_attributes = True
