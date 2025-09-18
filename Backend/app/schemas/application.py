from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class ApplicationBase(BaseModel):
    job_id: int
    candidate_id: int
    resume_file: Optional[str] = None
    status: Optional[str] = "Applied"
    fee_status: Optional[str] = None


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    resume_file: Optional[str] = None
    status: Optional[str] = None
    fee_status: Optional[str] = None


class ApplicationOut(ApplicationBase):
    application_id: int
    submission_date: datetime

    class Config:
        from_attributes = True
