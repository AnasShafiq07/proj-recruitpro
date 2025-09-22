# candidate_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.candidate import CandidateCreate, CandidateUpdate, CandidateOut, CandidateCreateWithAnswersAndPayment
from app.services.candidate import (
    create_candidate,
    get_candidate,
    get_candidates,
    update_candidate,
    delete_candidate,
)
from app.core.security import get_current_hr
from app.services.payment import create_payment


router = APIRouter(prefix="/candidates", tags=["Candidates"])

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_candidate_endpoint(candidate: CandidateCreateWithAnswersAndPayment, db: Session = Depends(get_db)):
    db_candidate = create_candidate(db, candidate)
    if candidate.payment is not None and db_candidate is not None:
        payment = create_payment(db, candidate.payment, db_candidate.candidate_id)
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Candidate not created")
    return {
        "candidate": db_candidate,
        "payment": payment
    }

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
