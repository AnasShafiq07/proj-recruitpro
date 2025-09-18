from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationOut
from app.services.application import (
    create_application,
    get_application,
    get_applications,
    update_application,
    delete_application,
)
from app.core.security import get_current_hr

router = APIRouter(prefix="/applications", tags=["Applications"], dependencies=[Depends(get_current_hr)])

@router.post("/", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application_endpoint(application: ApplicationCreate, db: Session = Depends(get_db)):
    return create_application(db, application)

@router.get("/{application_id}", response_model=ApplicationOut)
def get_application_endpoint(application_id: int, db: Session = Depends(get_db)):
    db_app = get_application(db, application_id)
    if not db_app:
        raise HTTPException(status_code=404, detail="Application not found")
    return db_app

@router.get("/", response_model=List[ApplicationOut])
def get_all_applications(db: Session = Depends(get_db)):
    return get_applications(db)

@router.put("/{application_id}", response_model=ApplicationOut)
def update_application_endpoint(application_id: int, application: ApplicationUpdate, db: Session = Depends(get_db)):
    db_app = update_application(db, application_id, application)
    if not db_app:
        raise HTTPException(status_code=404, detail="Application not found")
    return db_app

@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application_endpoint(application_id: int, db: Session = Depends(get_db)):
    deleted = delete_application(db, application_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Application not found")
    return None
