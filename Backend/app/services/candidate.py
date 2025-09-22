from sqlalchemy.orm import Session
from app.db import models
from app.schemas.candidate import CandidateCreate, CandidateUpdate, CandidateCreateWithAnswersAndPayment


def create_candidate(db: Session, candidate_data: CandidateCreateWithAnswersAndPayment):
    # create candidate
    db_candidate = models.Candidate(
        job_id = candidate_data.job_id,
        name=candidate_data.name,
        email=candidate_data.email,
        phone=candidate_data.phone,
        location=candidate_data.location,
        skills=candidate_data.skills,
        experience=candidate_data.experience,
        education=candidate_data.education,
        resume_url=candidate_data.resume_url 
    )
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)

    if candidate_data.answers:
        for ans in candidate_data.answers:
            db_answer = models.Answer(
                candidate_id=db_candidate.candidate_id,
                question_id=ans.question_id,
                answer_text=ans.answer_text
            )
            db.add(db_answer)

        db.commit() 
        db.refresh(db_candidate)

    return db_candidate



def get_candidate(db: Session, candidate_id: int):
    return db.query(models.Candidate).filter(models.Candidate.candidate_id == candidate_id).first()


def get_candidate_by_email(db: Session, email: str):
    return db.query(models.Candidate).filter(models.Candidate.email == email).first()


def get_candidates(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Candidate).offset(skip).limit(limit).all()


def update_candidate(db: Session, candidate_id: int, candidate: CandidateUpdate):
    db_candidate = get_candidate(db, candidate_id)
    if not db_candidate:
        return None
    for field, value in candidate.model_dump(exclude_unset=True).items():
        setattr(db_candidate, field, value)
    db.commit()
    db.refresh(db_candidate)
    return db_candidate


def delete_candidate(db: Session, candidate_id: int):
    db_candidate = get_candidate(db, candidate_id)
    if db_candidate:
        db.delete(db_candidate)
        db.commit()
    return db_candidate
