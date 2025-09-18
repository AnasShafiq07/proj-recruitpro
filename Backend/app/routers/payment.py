# payment_router.py (already shown before, included for completeness)
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.payment import PaymentCreate, PaymentUpdate, PaymentOut
from app.services.payment import (
    create_payment,
    get_payment,
    get_payments,
    update_payment,
    delete_payment,
)
from app.core.security import get_current_hr

router = APIRouter(prefix="/payments", tags=["Payments"], dependencies=[Depends(get_current_hr)])

@router.post("/", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def create_payment_endpoint(payment: PaymentCreate, db: Session = Depends(get_db)):
    return create_payment(db, payment)

@router.get("/{payment_id}", response_model=PaymentOut)
def get_payment_endpoint(payment_id: int, db: Session = Depends(get_db)):
    db_payment = get_payment(db, payment_id)
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return db_payment

@router.get("/", response_model=List[PaymentOut])
def get_all_payments(db: Session = Depends(get_db)):
    return get_payments(db)

@router.put("/{payment_id}", response_model=PaymentOut)
def update_payment_endpoint(payment_id: int, payment: PaymentUpdate, db: Session = Depends(get_db)):
    db_payment = update_payment(db, payment_id, payment)
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return db_payment

@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment_endpoint(payment_id: int, db: Session = Depends(get_db)):
    deleted = delete_payment(db, payment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Payment not found")
    return None
