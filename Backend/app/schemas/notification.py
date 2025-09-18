from pydantic import BaseModel
from typing import Optional


class NotificationBase(BaseModel):
    message: Optional[str] = None
    type: Optional[str] = None
    candidate_id: Optional[int] = None
    hr_id: Optional[int] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    message: Optional[str] = None
    type: Optional[str] = None


class NotificationOut(NotificationBase):
    notification_id: int

    class Config:
        from_attributes = True
