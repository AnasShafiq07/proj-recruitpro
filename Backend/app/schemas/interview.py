from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional, List

class HRAvailabilityBase(BaseModel):
    days: List[str] = Field(..., example=["Monday", "Wednesday", "Friday"])
    start_time: str = Field(..., example="09:00")  # "HH:MM"
    end_time: str = Field(..., example="17:00")
    duration_minutes: int = Field(..., example=30)
    break_minutes: int = Field(..., example=10)
    start_date: datetime
    end_date: datetime

class HRAvailabilityCreate(HRAvailabilityBase):
    pass

class HRAvailabilityUpdate(BaseModel):
    days: Optional[List[str]] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    break_minutes: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class HRAvailabilityOut(HRAvailabilityBase):
    id: int
    hr_id: int
    created_at: datetime
    class Config:
        orm_mode = True


class InterviewSlotBase(BaseModel):
    date: datetime
    start_time: str
    end_time: str
    is_booked: bool = False

class InterviewSlotCreate(InterviewSlotBase):
    availability_id: int

class InterviewSlotOut(InterviewSlotBase):
    id: int
    interview_id: Optional[int] = None
    class Config:
        orm_mode = True


class InterviewBase(BaseModel):
    candidate_id: int
    job_id: int
    scheduled_time: datetime
    meet_link: Optional[str] = None
    status: Optional[str] = "Scheduled"

class InterviewCreate(InterviewBase):
    pass

class InterviewUpdate(BaseModel):
    scheduled_time: Optional[datetime] = None
    meet_link: Optional[str] = None
    status: Optional[str] = None

class InterviewOut(InterviewBase):
    interview_id: int
    created_at: datetime
    class Config:
        orm_mode = True
