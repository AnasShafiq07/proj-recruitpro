from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Body
from app.core.security import get_current_hr



router = APIRouter(prefix="/analyzer", tags=["Resume Analyzer"], dependencies=[Depends(get_current_hr)])


@router.get("/")
def analyze_resume():
    return {"message": "Resume Analyzed"}

@router.get("/good")
def good_analysis():
    return {"message": "Good Resume"}