from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel




class CompanyBase(BaseModel):
    name: str


class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: str



class CompanyOut(CompanyBase):
    company_id: int
    created_at: datetime

    class Config:
        from_attributes = True

