from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.analyzer.matcher import upload_and_store_resume, match_job_with_resumes
from app.core.security import get_current_hr

router = APIRouter(prefix="/analyzer", tags=["Resume Analyzer"], dependencies=[Depends(get_current_hr)])

@router.post("/upload")
async def upload_resume_endpoint(
    candidate_id: int = Form(...),
    job_id: int = Form(...),
    resume: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    result = upload_and_store_resume(db, candidate_id, job_id, resume)
    return {"message": "uploaded", "data": result}


@router.post("/match/{job_id}")
def match_job_endpoint(job_id: int, top_k: Optional[int] = 20, db: Session = Depends(get_db)):
    res = match_job_with_resumes(db, job_id, top_k=top_k)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res
