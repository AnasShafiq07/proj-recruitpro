from sqlalchemy.orm import Session
from app.db import models
from app.schemas.payment import PaymentUpdate
from datetime import datetime
import stripe
from fastapi import HTTPException
from app.core.config import settings
import os
import dotenv

dotenv.load_dotenv()
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


def create_stripe_payment_intent(amount: float, currency: str = "usd"):
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),  # Stripe works in cents
            currency=currency,
            payment_method_types=["card"],
        )
        return intent
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


def create_payment_record(
    db: Session,
    candidate_id: int,
    job_id: int,
    amount: float,
    stripe_payment_intent_id: str,
    status: str = "Pending",
):
    db_payment = models.Payment(
        candidate_id=candidate_id,
        job_id=job_id,
        amount=amount,
        stripe_payment_intent_id=stripe_payment_intent_id,
        status=status,
        payment_date=datetime.utcnow(),
    )
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
