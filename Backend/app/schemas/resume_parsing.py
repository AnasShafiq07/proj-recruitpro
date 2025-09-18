from pydantic import BaseModel
from typing import Optional


class ResumeParsingBase(BaseModel):
    application_id: int
    skills_extracted: Optional[str] = None
    experience_extracted: Optional[str] = None
    education_extracted: Optional[str] = None
    ai_score: Optional[float] = None


class ResumeParsingCreate(ResumeParsingBase):
    pass


class ResumeParsingUpdate(BaseModel):
    skills_extracted: Optional[str] = None
    experience_extracted: Optional[str] = None
    education_extracted: Optional[str] = None
    ai_score: Optional[float] = None


class ResumeParsingOut(ResumeParsingBase):
    parsing_id: int

    class Config:
        from_attributes = True
