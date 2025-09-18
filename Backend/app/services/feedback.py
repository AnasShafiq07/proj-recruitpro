from sqlalchemy.orm import Session
from app.db import models
from app.schemas.feedback import FeedbackCreate, FeedbackUpdate


def create_feedback(db: Session, feedback: FeedbackCreate):
    db_feedback = models.Feedback(**feedback.model_dump())
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback


def get_feedback(db: Session, feedback_id: int):
    return db.query(models.Feedback).filter(models.Feedback.feedback_id == feedback_id).first()


def get_feedbacks(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Feedback).offset(skip).limit(limit).all()


def update_feedback(db: Session, feedback_id: int, feedback: FeedbackUpdate):
    db_feedback = get_feedback(db, feedback_id)
    if not db_feedback:
        return None
    for field, value in feedback.model_dump(exclude_unset=True).items():
        setattr(db_feedback, field, value)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback


def delete_feedback(db: Session, feedback_id: int):
    db_feedback = get_feedback(db, feedback_id)
    if db_feedback:
        db.delete(db_feedback)
        db.commit()
    return db_feedback
