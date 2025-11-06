from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.core.security import get_current_hr
from app.db.models import HRManager
from app.schemas.interview import HRAvailabilityCreate, HRAvailabilityUpdate
from app.services.hr_availability import (
    create_availability,
    get_availability,
    update_availability,
    delete_availability,
)

router = APIRouter(prefix="/availability", tags=["HR Availability"])

# ---------------- Create Availability ----------------
@router.post("/")
def create_hr_availability(
    data: HRAvailabilityCreate,
    db: Session = Depends(get_db),
    hr: HRManager = Depends(get_current_hr)
):
    availability = create_availability(db, hr.id, data)
    return availability


# ---------------- Get All Availability for HR ----------------
@router.get("/")
def list_hr_availability(
    db: Session = Depends(get_db),
    hr: HRManager = Depends(get_current_hr)
):
    
    availabilities = get_availability(db, hr.id)
    if not availabilities:
        raise HTTPException(status_code=404, detail="No availability found.")
    return availabilities


# ---------------- Update Availability ----------------
@router.put("/{availability_id}")
def update_hr_availability(
    availability_id: int,
    data: HRAvailabilityUpdate,
    db: Session = Depends(get_db),
    hr: HRManager = Depends(get_current_hr)
):
   
    updated = update_availability(db, availability_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Availability not found.")
    return updated


# ---------------- Delete Availability ----------------
@router.delete("/{availability_id}")
def delete_hr_availability(
    availability_id: int,
    db: Session = Depends(get_db),
    hr: HRManager = Depends(get_current_hr)
):
   
    deleted = delete_availability(db, availability_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Availability not found.")
    return {"message": "Availability deleted successfully."}
