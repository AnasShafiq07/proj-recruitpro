# app/schemas/job.py
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from .questions_form import QuestionsFormCreate, QuestionsFormUpdate

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

class JobCreateWithFormCreate(JobCreate):
    questions_form: Optional[QuestionsFormCreate] = None

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    deadline: Optional[datetime] = None
    application_fee: Optional[float] = None

class JobUpdateWithFormUpdate(JobUpdate):
    questions_form: Optional[QuestionsFormUpdate] = None


class JobOut(JobBase):
    job_id: int
    slug: str
    url: str

    class Config:
        from_attributes = True
