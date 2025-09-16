from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Body



router = APIRouter(prefix="/analyzer", tags=["Analyzer service for resumes"])


@router.post("/")
def analyze_resume():
    return {"message": "Resume Analyzed"}