from sqlalchemy.orm import Session
from app.db import models
from app.schemas.interview import InterviewCreate, InterviewUpdate


def create_interview(db: Session, interview: InterviewCreate):
    db_interview = models.Interview(**interview.model_dump())
    db.add(db_interview)
    db.commit()
    db.refresh(db_interview)
    return db_interview


def get_interview(db: Session, interview_id: int):
    return db.query(models.Interview).filter(models.Interview.interview_id == interview_id).first()


def get_interviews(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Interview).offset(skip).limit(limit).all()


def update_interview(db: Session, interview_id: int, interview: InterviewUpdate):
    db_interview = get_interview(db, interview_id)
    if not db_interview:
        return None
    for field, value in interview.model_dump(exclude_unset=True).items():
        setattr(db_interview, field, value)
    db.commit()
    db.refresh(db_interview)
    return db_interview


def delete_interview(db: Session, interview_id: int):
    db_interview = get_interview(db, interview_id)
    if db_interview:
        db.delete(db_interview)
        db.commit()
    return db_interview
