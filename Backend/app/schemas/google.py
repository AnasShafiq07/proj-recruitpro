from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class EventCreate(BaseModel):
    hr_id: int
    email: EmailStr
    summary: Optional[str] = "Job Meeting"
    description: Optional[str] = "Discuss updates"
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class EmailPayload(BaseModel):
    hr_id: int = Field(..., description="HR Manager ID")
    recipient: EmailStr = Field(..., description="Recipient email address")
    subject: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)