from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr




class CompanyBase(BaseModel):
    name: str
    email: EmailStr


class CompanyCreate(CompanyBase):
    password: str


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None


class CompanyRead(CompanyBase):
    company_id: int
    created_at: datetime

    class Config:
        from_attributes = True

