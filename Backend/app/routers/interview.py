from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.interview import InterviewCreate, InterviewUpdate, InterviewOut
from app.services.interview import (
    create_interview,
    get_interview,
    get_interviews_by_job,
    update_interview,
    delete_interview,
)
from app.core.security import get_current_hr

router = APIRouter(prefix="/interviews", tags=["Interviews"], dependencies=[Depends(get_current_hr)])

@router.post("/", response_model=InterviewOut, status_code=status.HTTP_201_CREATED)
def create_interview_endpoint(interview: InterviewCreate, db: Session = Depends(get_db)):
    return create_interview(db, interview)

@router.get("/{interview_id}", response_model=InterviewOut)
def get_interview_endpoint(interview_id: int, db: Session = Depends(get_db)):
    db_interview = get_interview(db, interview_id)
    if not db_interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return db_interview

@router.get("/by-job", response_model=List[InterviewOut])
def get_all_interviews(job_id: int, db: Session = Depends(get_db)):
    return get_interviews_by_job(db, job_id)

@router.put("/{interview_id}", response_model=InterviewOut)
def update_interview_endpoint(interview_id: int, interview: InterviewUpdate, db: Session = Depends(get_db)):
    db_interview = update_interview(db, interview_id, interview)
    if not db_interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return db_interview

@router.delete("/{interview_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_interview_endpoint(interview_id: int, db: Session = Depends(get_db)):
    deleted = delete_interview(db, interview_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Interview not found")
    return None
