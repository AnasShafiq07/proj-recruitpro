from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db  
from app.db import models
from app.analyzer.extractor import extract_text
from app.analyzer.matcher import generate_ai_scores_for_job  
from app.core.security import get_current_hr

router = APIRouter(
    prefix="/analyzer",
    tags=["Resume Analyzer"],
    dependencies=[Depends(get_current_hr)]
)

@router.get("/")
def analyze_resume():
    return {"message": "Resume Analyzer Endpoint"}

@router.post("/job/{job_id}/generate-scores")
def generate_scores_for_job(job_id: int, db: Session = Depends(get_db)):
    """
    Trigger AI score generation for all resumes of a specific job.
    """
    result = generate_ai_scores_for_job(db, job_id)
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result["error"]
        )
    return result
