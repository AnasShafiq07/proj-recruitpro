from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


class HRManagerBase(BaseModel):
    name: str
    email: EmailStr
    role: Optional[str] = "hr"


class HRManagerCreate(HRManagerBase):
    password: str
    company_id: int


class HRManagerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None


class HRManagerRead(HRManagerBase):
    hr_id: int
    company_id: int
    created_at: datetime

    class Config:
        from_attributes = True
