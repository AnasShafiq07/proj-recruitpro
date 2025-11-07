from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
import json

from app.db import models
from app.schemas.interview import (
    HRAvailabilityCreate, HRAvailabilityUpdate
)

def create_availability(db: Session, hr_id: int, data: HRAvailabilityCreate):
    db_obj = models.HRAvailability(
        hr_id=hr_id,
        days=json.dumps(data.days),
        start_time=data.start_time,
        end_time=data.end_time,
        duration_minutes=data.duration_minutes,
        break_minutes=data.break_minutes,
        start_date=data.start_date,
        end_date=data.end_date
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_availability(db: Session, hr_id: int):
    return db.query(models.HRAvailability).filter(models.HRAvailability.hr_id == hr_id).first()

def update_availability(db: Session, availability_id: int, data: HRAvailabilityUpdate):
    db_obj = db.query(models.HRAvailability).filter(models.HRAvailability.id == availability_id).first()
    if not db_obj:
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(db_obj, key, json.dumps(value) if key == "days" else value)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_availability(db: Session, availability_id: int):
    db_obj = db.query(models.HRAvailability).filter(models.HRAvailability.id == availability_id).first()
    if db_obj:
        db.delete(db_obj)
        db.commit()
    return db_obj

