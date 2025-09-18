from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class FeedbackBase(BaseModel):
    application_id: int
    comments: Optional[str] = None
    rating: Optional[int] = None


class FeedbackCreate(FeedbackBase):
    pass


class FeedbackUpdate(BaseModel):
    comments: Optional[str] = None
    rating: Optional[int] = None


class FeedbackOut(FeedbackBase):
    feedback_id: int
    created_at: datetime

    class Config:
        from_attributes = True
