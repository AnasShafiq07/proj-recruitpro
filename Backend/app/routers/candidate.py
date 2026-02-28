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
    get_selected_candi,
    get_all_candidates_by_job,
    deselect_candi,
    get_candidate_answers,
    get_candidates_without_interview as candidates_without_interview,
    update_interviewed_status,
    send_offer_letter,
    select_for_interview
)
from app.services.job import increment_applicants
from app.services.payment import create_stripe_payment_intent, create_payment_record
from app.db import models
from app.core.security import get_current_hr

router = APIRouter(prefix="/candidates", tags=["Candidates"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_candidate_endpoint(
    candidate: CandidateCreateWithAnswersAndPayment, db: Session = Depends(get_db)
):
    # Create candidate (prescreen + CV first)
    db_candidate = create_candidate(db, candidate)
    increment_applicants(db, candidate.job_id)
    # Check if job has an application fee
    job = db.query(models.Job).filter(models.Job.job_id == candidate.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # if job.application_fee and job.application_fee > 0:
    #     # Create Stripe PaymentIntent
    #     intent = create_stripe_payment_intent(amount=job.application_fee)

    #     # Create a pending payment record
    #     db_payment = create_payment_record(
    #         db=db,
    #         candidate_id=db_candidate.candidate_id,
    #         job_id=job.job_id,
    #         amount=job.application_fee,
    #         stripe_payment_intent_id=intent["id"],
    #         status="Pending",
    #     )   

    #     return {
    #         "candidate": db_candidate,
    #         "payment_intent": intent,
    #         "payment_record": db_payment,
    #     }
    # else:
    return {
        "candidate": {
            "candidate_id": db_candidate.candidate_id,
            "name": db_candidate.name,
            "email": db_candidate.email,
            "job_id": db_candidate.job_id,
        },
        "payment": None
    }


@router.get("/")
def get_all_candidates(db: Session = Depends(get_db), hr: models.HRManager = Depends(get_current_hr)):
    return get_candidates(db, hr.company_id)


@router.get("/by-job/{job_id}")
def get_candidates_by_job(job_id: int, db: Session = Depends(get_db)):
    candidates = get_all_candidates_by_job(db, job_id)
    if not candidates:
        raise HTTPException(status_code=404, detail="Job id not present.")
    for cand in candidates:
        if not cand.ai_score:
            cand.ai_score = 0
    return candidates 


@router.get("/filter/selected-for-interview/{job_id}")
def get_candidates_selected_for_interview(job_id: int, db: Session = Depends(get_db)):
    print(job_id)
    candidates = get_all_candidates_by_job(db, job_id)
    #candidates = get_selected_for_interview(db, job_id)
    return candidates


@router.get("/filter/selected-candidates/{job_id}")
def get_selected_candidates(job_id: int, db: Session = Depends(get_db)):
    candidates = get_selected_candi(db, job_id)
    return {
        "candidates": candidates,
        "length": len(candidates)
    }


@router.get("/candidates-without-interview/{job_id}")
def get_candidates_without_interview(job_id: int, db: Session = Depends(get_db), hr: models.HRManager = Depends(get_current_hr)):
    return candidates_without_interview(db, hr.id, job_id)


@router.put("/select/{candidate_id}")
def select_candidate(candidate_id: int, db: Session = Depends(get_db)):
    candidate = get_candidate(db, candidate_id)
    print(candidate.candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not present or have not given interview")    
    select_candi(db, candidate_id)
    return True    


@router.put("/select-for-interview/{candidate_id}")
def select_for_interview_endpoint(candidate_id: int, db: Session = Depends(get_db)):
    candidate = get_candidate(db, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    updated_candidate = select_for_interview(db, candidate_id)
    if not updated_candidate:
        raise HTTPException(status_code=400, detail="Failed to update candidate")
    
    return {
        "message": "Candidate selection updated successfully",
        "candidate_id": updated_candidate.candidate_id,
        "selected_for_interview": updated_candidate.selected_for_interview
    }  


@router.put("/de-select/{candidate_id}")
def deselect_candidate(candidate_id: int, db: Session = Depends(get_db)):
    candidate = get_candidate(db, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not present or have not given interview")    
    deselect_candi(db, candidate_id)
    return True    


@router.put("/interviewed/{candidate_id}")
def candidate_interviewed(candidate_id: int, db: Session = Depends(get_db)):
    return update_interviewed_status(db, candidate_id)


@router.get("/interviewed-candidates/{job_id}")
def get_interviewed_candidates(job_id: int, db: Session = Depends(get_db)):
    candidates = db.query(models.Candidate).filter(
        models.Candidate.job_id == job_id,
        models.Candidate.interviewed == True
    ).all()
    return {
        "candidates": candidates,
        "length": len(candidates)
    }


@router.post("/{candidate_id}/send-offer")
def send_offer_endpoint(
    candidate_id: int, 
    data: dict, 
    db: Session = Depends(get_db)
):
    """Send offer letter to a candidate"""
    candidate = get_candidate(db, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    offer = send_offer_letter(
        db, 
        candidate_id, 
        data.get("salary", ""),
        data.get("perks", ""),
        data.get("other_details", "")
    )
    
    if not offer:
        raise HTTPException(status_code=400, detail="Failed to send offer letter")
    
    return {
        "message": "Offer letter sent successfully",
        "candidate_id": candidate_id,
        "salary": offer.salary,
        "perks": offer.perks
    }


@router.get("/{candidate_id}")
def get_candidate_endpoint(candidate_id: int, db: Session = Depends(get_db)):
    db_candidate = get_candidate(db, candidate_id)
    db_answers = get_candidate_answers(db, candidate_id)
    if not db_candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return {
        "candidate": db_candidate,
        "answers": db_answers
    }    

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