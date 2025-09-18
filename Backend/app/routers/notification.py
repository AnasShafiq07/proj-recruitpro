from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.notification import NotificationCreate, NotificationUpdate, NotificationOut
from app.services.notifcation import (
    create_notification,
    get_notification,
    get_notifications,
    update_notification,
    delete_notification,
)
from app.core.security import get_current_hr

router = APIRouter(prefix="/notifications", tags=["Notifications"], dependencies=[Depends(get_current_hr)])

@router.post("/", response_model=NotificationOut, status_code=status.HTTP_201_CREATED)
def create_notification_endpoint(notification: NotificationCreate, db: Session = Depends(get_db)):
    return create_notification(db, notification)

@router.get("/{notification_id}", response_model=NotificationOut)
def get_notification_endpoint(notification_id: int, db: Session = Depends(get_db)):
    db_note = get_notification(db, notification_id)
    if not db_note:
        raise HTTPException(status_code=404, detail="Notification not found")
    return db_note

@router.get("/", response_model=List[NotificationOut])
def get_all_notifications(db: Session = Depends(get_db)):
    return get_notifications(db)

@router.put("/{notification_id}", response_model=NotificationOut)
def update_notification_endpoint(notification_id: int, notification: NotificationUpdate, db: Session = Depends(get_db)):
    db_note = update_notification(db, notification_id, notification)
    if not db_note:
        raise HTTPException(status_code=404, detail="Notification not found")
    return db_note

@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification_endpoint(notification_id: int, db: Session = Depends(get_db)):
    deleted = delete_notification(db, notification_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Notification not found")
    return None
