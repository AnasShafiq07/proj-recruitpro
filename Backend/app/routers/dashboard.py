from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Body
from app.core.security import get_current_company, get_current_hr


router = APIRouter(prefix="/dashboard", tags=["Dashboard"], dependencies=[Depends(get_current_hr)])


@router.get("/")
def analyze_resume():
    return {"message": "Recruit Pro Dashboard"}