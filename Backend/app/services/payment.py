from sqlalchemy.orm import Session
from app.db import models
from app.schemas.payment import PaymentCreate, PaymentUpdate


def create_payment(db: Session, payment: PaymentCreate):
    db_payment = models.Payment(**payment.model_dump())
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment


def get_payment(db: Session, payment_id: int):
    return db.query(models.Payment).filter(models.Payment.payment_id == payment_id).first()


def get_payments(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Payment).offset(skip).limit(limit).all()


def update_payment(db: Session, payment_id: int, payment: PaymentUpdate):
    db_payment = get_payment(db, payment_id)
    if not db_payment:
        return None
    for field, value in payment.model_dump(exclude_unset=True).items():
        setattr(db_payment, field, value)
    db.commit()
    db.refresh(db_payment)
    return db_payment


def delete_payment(db: Session, payment_id: int):
    db_payment = get_payment(db, payment_id)
    if db_payment:
        db.delete(db_payment)
        db.commit()
    return db_payment
