from pydantic import BaseModel
from typing import List
from app.schemas.question import QuestionOut, QuestionCreate



class QuestionsFormCreate(BaseModel):
    # create form with a list of questions
    questions: List[QuestionCreate] = []


class QuestionsFormUpdate(BaseModel):
    # allow updating only questions (not job_id)
    questions: List[QuestionCreate] = []


class QuestionsFormOut(BaseModel):
    job_id: int
    form_id: int
    questions: List[QuestionOut] = []

    class Config:
        from_attributes = True
