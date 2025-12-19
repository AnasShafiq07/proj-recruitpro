from pydantic import BaseModel, EmailStr
from typing import Optional, List
from .payment import PaymentInCandidate

class AnswerBase(BaseModel):
    question_id: int
    answer_text: str

class CandidateBase(BaseModel):
    job_id: int
    company_id: int
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
    payment: Optional[PaymentInCandidate] = None  

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



class SelectedCandidateBase(BaseModel):
    candidate_id: int
    hr_id: int
    job_id: int
    selected_for_interview: bool = False
    selected: bool = False
    selection_reason: str | None = None

class SelectedCandidateCreate(SelectedCandidateBase):
    pass