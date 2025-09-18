# app/schemas/job.py
from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class JobBase(BaseModel):
    title: str
    description: Optional[str] = None
    requirements: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    deadline: Optional[datetime] = None
    application_fee: Optional[float] = None


class JobCreate(JobBase):
    hr_id: int


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    deadline: Optional[datetime] = None
    application_fee: Optional[float] = None


class JobOut(JobBase):
    job_id: int

    class Config:
        from_attributes = True
