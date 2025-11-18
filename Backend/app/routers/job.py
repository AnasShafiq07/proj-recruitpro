# job_router.py
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.db.models import HRManager, Job
from app.schemas.job import JobCreate, JobUpdate, JobOut, JobCreateWithFormCreate, JobUpdateWithFormUpdate
from fastapi import Request
from app.services.job import (
    create_job,
    get_job,
    get_jobs as get_db_jobs,
    update_job,
    delete_job,
    get_job_questions,
    get_job_by_slug, 
    get_jobs_by_company,
    get_jobs_by_department
)
from app.core.security import get_current_hr

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post("/", status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_hr)])
def create_job_endpoint(job: JobCreateWithFormCreate, db: Session = Depends(get_db), request: Request = None, hr: HRManager = Depends(get_current_hr)):
    job.hr_id = hr.id
    job.company_id = hr.company_id
    new_job = create_job(db, job)
    url = new_job.slug
    return {
        "job": new_job,
        "job_link": url
    }


@router.get("/get-all")
def get_jobs(db: Session = Depends(get_db), hr: HRManager = Depends(get_current_hr)):
    jobs: List[Job] = get_jobs_by_company(db, hr.company_id)
    if jobs:  # have to remove this 
        for job in jobs:
            if not job.created_at:
                job.created_at = datetime.now(timezone.utc)
    return jobs

@router.get("/by-dept/{dept_id}")
def get_by_dept(dept_id: int, db: Session = Depends(get_db)):
    return get_jobs_by_department(db, dept_id)


@router.get("/{job_id}", dependencies=[Depends(get_current_hr)])
def get_job_endpoint(job_id: int, db: Session = Depends(get_db)):
    db_job = get_job(db, job_id)
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    return db_job

@router.get("/url/{slug}")
def get_job_by_slug_endpoint(slug: str, db: Session = Depends(get_db)):
    db_job = get_job_by_slug(db, slug)
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    db_questions = get_job_questions(db, db_job.job_id)
    return {
        "job": db_job,
        "questions": db_questions
    }


@router.get("/", dependencies=[Depends(get_current_hr)])
def get_all_jobs(db: Session = Depends(get_db)):
    return get_db_jobs(db)

@router.get("/questions/{job_id}")
def get_questions_by_job(job_id: int, db: Session = Depends(get_db)):
    return get_job_questions(db, job_id)

@router.put("/{job_id}", response_model=JobOut, dependencies=[Depends(get_current_hr)])
def update_job_endpoint(job_id: int, job: JobUpdateWithFormUpdate, db: Session = Depends(get_db)):
    db_job = update_job(db, job_id, job)
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    return db_job

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_hr)])
def delete_job_endpoint(job_id: int, db: Session = Depends(get_db)):
    deleted = delete_job(db, job_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Job not found")
    return None
    
