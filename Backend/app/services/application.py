from sqlalchemy.orm import Session
from app.db import models
from app.schemas.application import ApplicationCreate, ApplicationUpdate 


def create_application(db: Session, application: ApplicationCreate):
    db_application = models.Application(**application.model_dump())
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    return db_application


def get_application(db: Session, application_id: int):
    return db.query(models.Application).filter(models.Application.application_id == application_id).first()


def get_applications(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Application).offset(skip).limit(limit).all()


def update_application(db: Session, application_id: int, application: ApplicationUpdate):
    db_application = get_application(db, application_id)
    if not db_application:
        return None
    for field, value in application.model_dump(exclude_unset=True).items():
        setattr(db_application, field, value)
    db.commit()
    db.refresh(db_application)
    return db_application


def delete_application(db: Session, application_id: int):
    db_application = get_application(db, application_id)
    if db_application:
        db.delete(db_application)
        db.commit()
    return db_application
