from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.candidate import (
    CandidateCreate,
    CandidateUpdate,
    CandidateOut,
    CandidateCreateWithAnswersAndPayment,
)
from app.services.candidate import (
    create_candidate,
    get_candidate,
    get_candidates,
    update_candidate,
    delete_candidate,
    select_candi,
    get_selected_for_interview,
    get_selected_candi
)

from app.services.payment import create_stripe_payment_intent, create_payment_record
from app.db import models

router = APIRouter(prefix="/candidates", tags=["Candidates"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_candidate_endpoint(
    candidate: CandidateCreateWithAnswersAndPayment, db: Session = Depends(get_db)
):
    # Create candidate (prescreen + CV first)
    db_candidate = create_candidate(db, candidate)

    # Check if job has an application fee
    job = db.query(models.Job).filter(models.Job.job_id == candidate.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if job.application_fee and job.application_fee > 0:
        # Create Stripe PaymentIntent
        intent = create_stripe_payment_intent(amount=job.application_fee)

        # Create a pending payment record
        db_payment = create_payment_record(
            db=db,
            candidate_id=db_candidate.candidate_id,
            job_id=job.job_id,
            amount=job.application_fee,
            stripe_payment_intent_id=intent["id"],
            status="Pending",
        )

        return {
            "candidate": db_candidate,
            "payment_intent": intent,
            "payment_record": db_payment,
        }
    else:
        return {"candidate": db_candidate, "payment": None}


@router.get("/{candidate_id}", response_model=CandidateOut)
def get_candidate_endpoint(candidate_id: int, db: Session = Depends(get_db)):
    db_candidate = get_candidate(db, candidate_id)
    if not db_candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return db_candidate


@router.post("/select/{candidate_id}")
def select_candidate(candidate_id: int, db: Session = Depends(get_db)):
    candidate = get_candidate(db, candidate_id)
    if not candidate or candidate.selected_for_interview == False:
        raise HTTPException(status_code=404, detail="Candidate not present or have not given interview")    
    select_candi(db, candidate_id)
    return True    

@router.get("/")
def get_all_candidates(db: Session = Depends(get_db)):
    return get_candidates(db)


@router.put("/{candidate_id}", response_model=CandidateOut)
def update_candidate_endpoint(
    candidate_id: int, candidate: CandidateUpdate, db: Session = Depends(get_db)
):
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


@router.get("/filter/selected-for-interview")
def get_candidates_selected_for_interview(db: Session = Depends(get_db)):
    # return get_selected_for_interview(db)
    candiadates = get_selected_for_interview(db)
    return {
        "candidates": candiadates,
        "length": len(candiadates)
    }


@router.get("/filter/selected-candidates")
def get_selected_candidates(db: Session = Depends(get_db)):
    candidates = get_selected_candi(db)
    return {
        "candidates": candidates,
        "length": len(candidates)
    }