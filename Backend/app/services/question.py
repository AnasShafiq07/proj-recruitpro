from sqlalchemy.orm import Session
from app.db import models
from app.schemas.question import QuestionCreate, QuestionUpdate


def create_question(db: Session, question: QuestionCreate):
    db_question = models.Question(**question.model_dump())
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question


def get_question(db: Session, question_id: int):
    return db.query(models.Question).filter(models.Question.question_id == question_id).first()


def get_questions(db: Session, form_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(models.Question).filter(models.Question.form_id == form_id).offset(skip).limit(limit).all()
    )


def update_question(db: Session, question_id: int, question: QuestionUpdate):
    db_question = get_question(db, question_id)
    if not db_question:
        return None
    for field, value in question.model_dump(exclude_unset=True).items():
        setattr(db_question, field, value)
    db.commit()
    db.refresh(db_question)
    return db_question


def delete_question(db: Session, question_id: int):
    db_question = get_question(db, question_id)
    if db_question:
        db.delete(db_question)
        db.commit()
    return db_question
