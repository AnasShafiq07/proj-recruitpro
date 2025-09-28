from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class EventCreate(BaseModel):
    hr_id: int
    email: EmailStr
    summary: Optional[str] = "Job Meeting"
    description: Optional[str] = "Discuss updates"
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
