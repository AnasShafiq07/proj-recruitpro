from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class EventCreate(BaseModel):
    job_id: int
    email: EmailStr 
    summary: Optional[str] = "Job Meeting"
    description: Optional[str] = "Discuss updates"
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class EmailPayload(BaseModel):
    recipient: EmailStr = Field(..., description="Recipient email address")
    subject: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)


class SchedulingDetails(BaseModel):
    job_id: int
    summary: Optional[str] = "Job Meeting"
    description: Optional[str] = "Discuss updates"