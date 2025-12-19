from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
import json

from app.db import models
from app.schemas.interview import (
    InterviewCreate, InterviewUpdate
)

def create_interview(db: Session, data: InterviewCreate):
    db_interview = models.Interview(**data.model_dump())
    db.add(db_interview)
    db.commit()
    db.refresh(db_interview)
    return db_interview

def get_interview(db: Session, interview_id: int):
    return db.query(models.Interview).filter(models.Interview.interview_id == interview_id).first()

def get_interviews_by_job(db: Session, job_id: int):
    return db.query(models.Interview).filter(models.Interview.job_id == job_id).all()

def update_interview(db: Session, interview_id: int, data: InterviewUpdate):
    db_interview = get_interview(db, interview_id)
    if not db_interview:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_interview, key, value)
    db.commit()
    db.refresh(db_interview)
    return db_interview

def delete_interview(db: Session, interview_id: int):
    db_interview = get_interview(db, interview_id)
    if db_interview:
        db.delete(db_interview)
        db.commit()
    return db_interview

