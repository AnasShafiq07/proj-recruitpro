from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.db.models import HRManager
from app.schemas.hr_manager import HRManagerCreate, HRManagerUpdate, HRManagerOut
from app.services.hr_manager import (
    create_hr_manager,
    get_hr_manager,
    get_hr_managers,
    update_hr_manager,
    delete_hr_manager,
)
from app.core.security import get_current_hr

router = APIRouter(prefix="/hr-managers", tags=["HR Managers"], dependencies=[Depends(get_current_hr)])


@router.get("/curr-hr")
def get_current_hr(hr:HRManager = Depends(get_current_hr)):
    return {
        "id": hr.id,
        "name": hr.name,
        "email": hr.email,
        "role": hr.role,
        "company_id": hr.company_id,
        "created_at": hr.created_at
    }

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_hr_manager_endpoint(hr: HRManagerCreate, db: Session = Depends(get_db)):
    return create_hr_manager(db, hr)

@router.get("/{hr_id}")
def get_hr_manager_endpoint(hr_id: int, db: Session = Depends(get_db)):
    db_hr = get_hr_manager(db, hr_id)
    if not db_hr:
        raise HTTPException(status_code=404, detail="HR Manager not found")
    return db_hr

@router.get("/")
def get_all_hr_managers(db: Session = Depends(get_db)):
    return get_hr_managers(db)

@router.put("/{hr_id}")
def update_hr_manager_endpoint(hr_id: int, hr: HRManagerUpdate, db: Session = Depends(get_db)):
    db_hr = update_hr_manager(db, hr_id, hr)
    if not db_hr:
        raise HTTPException(status_code=404, detail="HR Manager not found")
    return db_hr

@router.delete("/{hr_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hr_manager_endpoint(hr_id: int, db: Session = Depends(get_db)):
    deleted = delete_hr_manager(db, hr_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="HR Manager not found")
    return None
