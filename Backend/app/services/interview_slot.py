from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
import json

from app.db import models
from app.schemas.interview import (
    InterviewSlotCreate
)

# ---------- INTERVIEW SLOT CRUD ----------
def create_slot(db: Session, data: InterviewSlotCreate):
    db_slot = models.InterviewSlot(**data.model_dump())
    db.add(db_slot)
    db.commit()
    db.refresh(db_slot)
    return db_slot

def get_slots(db: Session, availability_id: int) -> List[models.InterviewSlot]:
    return db.query(models.InterviewSlot).filter(models.InterviewSlot.availability_id == availability_id).all()

def mark_slot_booked(db: Session, slot_id: int, interview_id: int):
    slot = db.query(models.InterviewSlot).filter(models.InterviewSlot.id == slot_id).first()
    if not slot:
        return None
    slot.is_booked = True
    slot.interview_id = interview_id
    db.commit()
    db.refresh(slot)
    return slot

