# resume_parsing_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.resume_parsing import ResumeParsingCreate, ResumeParsingUpdate, ResumeParsingOut
from app.services.resume_parsing import (
    create_resume_parsing,
    get_resume_parsing,
    get_resume_parsings,
    update_resume_parsing,
    delete_resume_parsing,
)
from app.core.security import get_current_hr

router = APIRouter(prefix="/resume-parsing", tags=["Resume Parsing"], dependencies=[Depends(get_current_hr)])

@router.post("/", response_model=ResumeParsingOut, status_code=status.HTTP_201_CREATED)
def create_resume_parsing_endpoint(parsing: ResumeParsingCreate, db: Session = Depends(get_db)):
    return create_resume_parsing(db, parsing)

@router.get("/{parsing_id}", response_model=ResumeParsingOut)
def get_resume_parsing_endpoint(parsing_id: int, db: Session = Depends(get_db)):
    db_parsing = get_resume_parsing(db, parsing_id)
    if not db_parsing:
        raise HTTPException(status_code=404, detail="Resume Parsing not found")
    return db_parsing

@router.get("/", response_model=List[ResumeParsingOut])
def get_all_resume_parsings(db: Session = Depends(get_db)):
    return get_resume_parsings(db)

@router.put("/{parsing_id}", response_model=ResumeParsingOut)
def update_resume_parsing_endpoint(parsing_id: int, parsing: ResumeParsingUpdate, db: Session = Depends(get_db)):
    db_parsing = update_resume_parsing(db, parsing_id, parsing)
    if not db_parsing:
        raise HTTPException(status_code=404, detail="Resume Parsing not found")
    return db_parsing

@router.delete("/{parsing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume_parsing_endpoint(parsing_id: int, db: Session = Depends(get_db)):
    deleted = delete_resume_parsing(db, parsing_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Resume Parsing not found")
    return None
