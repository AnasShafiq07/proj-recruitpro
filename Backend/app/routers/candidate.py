# candidate_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.candidate import CandidateCreate, CandidateUpdate, CandidateOut
from app.services.candidate import (
    create_candidate,
    get_candidate,
    get_candidates,
    update_candidate,
    delete_candidate,
)
from app.core.security import get_current_hr

router = APIRouter(prefix="/candidates", tags=["Candidates"])

@router.post("/", response_model=CandidateOut, status_code=status.HTTP_201_CREATED)
def create_candidate_endpoint(candidate: CandidateCreate, db: Session = Depends(get_db)):
    return create_candidate(db, candidate)

@router.get("/{candidate_id}", response_model=CandidateOut)
def get_candidate_endpoint(candidate_id: int, db: Session = Depends(get_db)):
    db_candidate = get_candidate(db, candidate_id)
    if not db_candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return db_candidate

@router.get("/", response_model=List[CandidateOut])
def get_all_candidates(db: Session = Depends(get_db)):
    return get_candidates(db)

@router.put("/{candidate_id}", response_model=CandidateOut)
def update_candidate_endpoint(candidate_id: int, candidate: CandidateUpdate, db: Session = Depends(get_db)):
    db_candidate = update_candidate(db, candidate_id, candidate)
    if not db_candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return db_candidate

@router.delete("/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate_endpoint(candidate_id: int, db: Session = Depends(get_db)):
    deleted = delete_candidate(db, candidate_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return None
