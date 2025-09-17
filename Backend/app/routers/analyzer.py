from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Body



router = APIRouter(prefix="/analyzer", tags=["Resume Analyzer"])


@router.get("/")
def analyze_resume():
    return {"message": "Resume Analyzed"}