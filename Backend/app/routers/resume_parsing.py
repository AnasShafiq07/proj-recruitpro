
from fastapi import APIRouter, Depends, HTTPException, status, Query
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
import requests
from app.db import models


router = APIRouter(
    prefix="/resume-parsing",
    tags=["Resume Parsing"],
    dependencies=[Depends(get_current_hr)]
)

from app.db.session import get_db
from app.services.resume_parsing import generate_and_send_feedback
from app.core.security import get_current_hr

router = APIRouter(prefix="/feedback", tags=["Feedback"], dependencies=[Depends(get_current_hr)])


@router.post("/send/{parsing_id}")
def send_feedback(parsing_id: int, db: Session = Depends(get_db), hr=Depends(get_current_hr)):
    result = generate_and_send_feedback(
        db=db,
        parsing_id=parsing_id,
        hr_id=hr.id  # ✅ pass hr.id here
    )
    return result


@router.post("/send_all")
def send_feedback_all(db: Session = Depends(get_db), hr=Depends(get_current_hr)):
    parsings = db.query(models.ResumeParsing).all()
    if not parsings:
        return {"error": "No resume parsing records found"}

    results = []
    for parsing in parsings:
        candidate = db.query(models.Candidate).filter(models.Candidate.candidate_id == parsing.candidate_id).first()
        if not candidate:
            results.append({"parsing_id": parsing.parsing_id, "error": "Candidate not found"})
            continue

        # Hardcoded AI feedback
        ai_feedback = "good job"

        # Email payload
        email_payload = {
            "hr_id": hr.id,
            "recipient": candidate.email,
            "subject": "Your Resume Analysis Feedback",
            "content": ai_feedback
        }

        response = requests.post("http://localhost:8000/googlesend_email", json=email_payload)

        if response.status_code not in [200, 202]:
            results.append({"parsing_id": parsing.parsing_id, "error": response.json()})
        else:
            results.append({"parsing_id": parsing.parsing_id, "success": f"Feedback sent to {candidate.email}"})

    return {"results": results}




@router.post("/", response_model=ResumeParsingOut, status_code=status.HTTP_201_CREATED)
def create_resume_parsing_endpoint(
    parsing: ResumeParsingCreate,
    db: Session = Depends(get_db)
):
    """Create a new resume parsing record."""
    return create_resume_parsing(db, parsing)


@router.get("/{parsing_id}", response_model=ResumeParsingOut)
def get_resume_parsing_endpoint(
    parsing_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific resume parsing by ID."""
    db_parsing = get_resume_parsing(db, parsing_id)
    if not db_parsing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume Parsing not found"
        )
    return db_parsing


@router.get("/", response_model=List[ResumeParsingOut])
def get_all_resume_parsings(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, le=500, description="Max number of records to return"),
    db: Session = Depends(get_db)
):
    """Get all resume parsings with pagination."""
    return get_resume_parsings(db, skip=skip, limit=limit)


@router.put("/{parsing_id}", response_model=ResumeParsingOut)
def update_resume_parsing_endpoint(
    parsing_id: int,
    parsing: ResumeParsingUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing resume parsing record."""
    db_parsing = update_resume_parsing(db, parsing_id, parsing)
    if not db_parsing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume Parsing not found"
        )
    return db_parsing


@router.delete("/{parsing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume_parsing_endpoint(
    parsing_id: int,
    db: Session = Depends(get_db)
):
    """Delete a resume parsing record."""
    deleted = delete_resume_parsing(db, parsing_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume Parsing not found"
        )
    return None