from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.payment import PaymentCreate, PaymentUpdate, PaymentOut
from app.services.payment import (
    create_payment_record,
    create_stripe_payment_intent,
    get_payment,
    get_payments,
    update_payment,
    delete_payment,
)
import stripe
import os
from app.core.security import get_current_hr
from app.db import models

# Stripe config
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# ⚡ Option 1: Use webhook secret from CLI (local only)
WEBHOOK_SECRET = "whsec_339d67665a25ddfd79035d7e42fb178130ee0c053ae00a1e915766f8a7cf74f7"

router = APIRouter(prefix="/payments", tags=["Payments"])


# ----------------------
# 🔔 Stripe Webhook (no auth required)
# ----------------------
@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    print("🔔 Webhook called")  # Debug log

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)
    except Exception as e:
        print(f"❌ Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    print(f"✅ Event received: {event['type']}")

    if event["type"] == "payment_intent.succeeded":
        intent = event["data"]["object"]
        stripe_payment_intent_id = intent["id"]

        print(f"💳 PaymentIntent succeeded: {stripe_payment_intent_id}")

        # Find matching Payment record in DB
        db_payment = (
            db.query(models.Payment)
            .filter(models.Payment.stripe_payment_intent_id == stripe_payment_intent_id)
            .first()
        )

        if db_payment:
            db_payment.status = "Success"
            db.commit()
            db.refresh(db_payment)
            print("✅ Payment updated in DB")
        else:
            print("⚠️ No matching payment record found")

    return {"status": "success"}


# ----------------------
# ✅ Protected routes (HR login required)
# ----------------------
@router.get("/{payment_id}", response_model=PaymentOut, dependencies=[Depends(get_current_hr)])
def get_payment_endpoint(payment_id: int, db: Session = Depends(get_db)):
    db_payment = get_payment(db, payment_id)
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return db_payment


@router.get("/", response_model=List[PaymentOut], dependencies=[Depends(get_current_hr)])
def get_all_payments(db: Session = Depends(get_db)):
    return get_payments(db)


@router.put("/{payment_id}", response_model=PaymentOut, dependencies=[Depends(get_current_hr)])
def update_payment_endpoint(payment_id: int, payment: PaymentUpdate, db: Session = Depends(get_db)):
    db_payment = update_payment(db, payment_id, payment)
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return db_payment


@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_hr)])
def delete_payment_endpoint(payment_id: int, db: Session = Depends(get_db)):
    deleted = delete_payment(db, payment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Payment not found")
    return None
