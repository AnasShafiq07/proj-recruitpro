from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class InterviewBase(BaseModel):
    application_id: int
    scheduled_time: Optional[datetime] = None
    meet_link: Optional[str] = None
    status: Optional[str] = None


class InterviewCreate(InterviewBase):
    pass


class InterviewUpdate(BaseModel):
    scheduled_time: Optional[datetime] = None
    meet_link: Optional[str] = None
    status: Optional[str] = None


class InterviewOut(InterviewBase):
    interview_id: int

    class Config:
        from_attributes = True
