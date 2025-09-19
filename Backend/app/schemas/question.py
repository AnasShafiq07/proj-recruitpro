from pydantic import BaseModel
from typing import Optional


class QuestionBase(BaseModel):
    question_text: str


class QuestionCreate(QuestionBase):
    pass 


class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None


class QuestionOut(QuestionBase):
    question_id: int

    class Config:
        from_attributes = True
