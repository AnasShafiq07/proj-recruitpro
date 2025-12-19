from pydantic import BaseModel
from typing import List
from app.schemas.question import QuestionOut, QuestionCreate



class QuestionsFormCreate(BaseModel):
    questions: List[QuestionCreate] = []


class QuestionsFormUpdate(BaseModel):
    questions: List[QuestionCreate] = []


class QuestionsFormOut(BaseModel):
    job_id: int
    form_id: int
    questions: List[QuestionOut] = []

    class Config:
        from_attributes = True
