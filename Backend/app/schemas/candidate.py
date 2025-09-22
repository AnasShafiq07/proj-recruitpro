from pydantic import BaseModel, EmailStr
from typing import Optional, List
from .payment import PaymentCreate

class AnswerBase(BaseModel):
    question_id: int
    answer_text: str


class CandidateBase(BaseModel):
    job_id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    resume_url: Optional[str] = None


class CandidateCreate(CandidateBase):
    pass

class AnswerCreate(AnswerBase):
    pass

class CandidateCreateWithAnswersAndPayment(CandidateCreate):
    answers: Optional[List[AnswerCreate]] = None
    payment: Optional[PaymentCreate] = None


class CandidateUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    skills: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    resume_url: Optional[str] = None


class CandidateOut(CandidateBase):
    candidate_id: int

    class Config:
        from_attributes = True
