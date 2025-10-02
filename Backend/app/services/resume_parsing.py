from sqlalchemy.orm import Session
from app.db import models
from app.schemas.resume_parsing import ResumeParsingCreate, ResumeParsingUpdate
from sqlalchemy.orm import Session
from app.db import models
from datetime import datetime
from typing import Optional

def save_resume_parsing(
    db: Session,
    candidate_id: int,
    job_id: int,
    parsed_text: str,
    skills_extracted: Optional[str] = None,
    experience_extracted: Optional[str] = None,
    education_extracted: Optional[str] = None,
):
    parsing = models.ResumeParsing(
        candidate_id=candidate_id,
        job_id=job_id,
        parsed_text=parsed_text,
        skills_extracted=skills_extracted,
        experience_extracted=experience_extracted,
        education_extracted=education_extracted,
        created_at=datetime.utcnow(),
    )
    db.add(parsing)
    db.commit()
    db.refresh(parsing)
    return parsing


def create_resume_parsing(db: Session, parsing: ResumeParsingCreate):
    db_parsing = models.ResumeParsing(**parsing.model_dump())
    db.add(db_parsing)
    db.commit()
    db.refresh(db_parsing)
    return db_parsing


def get_resume_parsing(db: Session, parsing_id: int):
    return db.query(models.ResumeParsing).filter(models.ResumeParsing.parsing_id == parsing_id).first()


def get_resume_parsings(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.ResumeParsing).offset(skip).limit(limit).all()


def update_resume_parsing(db: Session, parsing_id: int, parsing: ResumeParsingUpdate):
    db_parsing = get_resume_parsing(db, parsing_id)
    if not db_parsing:
        return None
    for field, value in parsing.model_dump(exclude_unset=True).items():
        setattr(db_parsing, field, value)
    db.commit()
    db.refresh(db_parsing)
    return db_parsing


def delete_resume_parsing(db: Session, parsing_id: int):
    db_parsing = get_resume_parsing(db, parsing_id)
    if db_parsing:
        db.delete(db_parsing)
        db.commit()
    return db_parsing
