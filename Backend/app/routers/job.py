# job_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.job import JobCreate, JobUpdate, JobOut, JobCreateWithFormCreate, JobUpdateWithFormUpdate
from app.services.job import (
    create_job,
    get_job,
    get_jobs,
    update_job,
    delete_job,
    get_job_questions
)
from app.core.security import get_current_hr

router = APIRouter(prefix="/jobs", tags=["Jobs"], dependencies=[Depends(get_current_hr)])

@router.post("/", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job_endpoint(job: JobCreateWithFormCreate, db: Session = Depends(get_db)):
    return create_job(db, job)

@router.get("/{job_id}", response_model=JobOut)
def get_job_endpoint(job_id: int, db: Session = Depends(get_db)):
    db_job = get_job(db, job_id)
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    return db_job

@router.get("/", response_model=List[JobOut])
def get_all_jobs(db: Session = Depends(get_db)):
    return get_jobs(db)

@router.get("/questions/{job_id}")
def get_questions_by_job(job_id: int, db: Session = Depends(get_db)):
    return get_job_questions(db, job_id)

@router.put("/{job_id}", response_model=JobOut)
def update_job_endpoint(job_id: int, job: JobUpdateWithFormUpdate, db: Session = Depends(get_db)):
    db_job = update_job(db, job_id, job)
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    return db_job

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job_endpoint(job_id: int, db: Session = Depends(get_db)):
    deleted = delete_job(db, job_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Job not found")
    return None
