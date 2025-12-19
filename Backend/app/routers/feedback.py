from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.feedback import FeedbackCreate, FeedbackUpdate, FeedbackOut
from app.services.feedback import (
    create_feedback,
    get_feedback,
    get_feedbacks,
    update_feedback,
    delete_feedback,
)
from app.core.security import get_current_hr

router = APIRouter(prefix="/feedbacks", tags=["Feedbacks"], dependencies=[Depends(get_current_hr)])

@router.post("/", response_model=FeedbackOut, status_code=status.HTTP_201_CREATED)
def create_feedback_endpoint(feedback: FeedbackCreate, db: Session = Depends(get_db)):
    return create_feedback(db, feedback)

@router.get("/{feedback_id}", response_model=FeedbackOut)
def get_feedback_endpoint(feedback_id: int, db: Session = Depends(get_db)):
    db_feedback = get_feedback(db, feedback_id)
    if not db_feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return db_feedback

@router.get("/", response_model=List[FeedbackOut])
def get_all_feedbacks(db: Session = Depends(get_db)):
    return get_feedbacks(db)

@router.put("/{feedback_id}", response_model=FeedbackOut)
def update_feedback_endpoint(feedback_id: int, feedback: FeedbackUpdate, db: Session = Depends(get_db)):
    db_feedback = update_feedback(db, feedback_id, feedback)
    if not db_feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return db_feedback

@router.delete("/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feedback_endpoint(feedback_id: int, db: Session = Depends(get_db)):
    deleted = delete_feedback(db, feedback_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return None
