from sqlalchemy.orm import Session
from app.db import models 
from app.schemas.job import JobCreate, JobUpdate


def create_job(db: Session, job: JobCreate):
    db_job = models.Job(**job.model_dump())
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


def get_job(db: Session, job_id: int):
    return db.query(models.Job).filter(models.Job.job_id == job_id).first()


def get_jobs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Job).offset(skip).limit(limit).all()


def update_job(db: Session, job_id: int, job: JobUpdate):
    db_job = get_job(db, job_id)
    if not db_job:
        return None
    for field, value in job.model_dump(exclude_unset=True).items():
        setattr(db_job, field, value)
    db.commit()
    db.refresh(db_job)
    return db_job


def delete_job(db: Session, job_id: int):
    db_job = get_job(db, job_id)
    if db_job:
        db.delete(db_job)
        db.commit()
    return db_job
