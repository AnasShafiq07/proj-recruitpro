from sqlalchemy.orm import Session
from app.db import models
from app.schemas.notification import NotificationCreate, NotificationUpdate


def create_notification(db: Session, notification: NotificationCreate):
    db_notification = models.Notification(**notification.model_dump())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification


def get_notification(db: Session, notification_id: int):
    return db.query(models.Notification).filter(models.Notification.notification_id == notification_id).first()


def get_notifications(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Notification).offset(skip).limit(limit).all()


def update_notification(db: Session, notification_id: int, notification: NotificationUpdate):
    db_notification = get_notification(db, notification_id)
    if not db_notification:
        return None
    for field, value in notification.model_dump(exclude_unset=True).items():
        setattr(db_notification, field, value)
    db.commit()
    db.refresh(db_notification)
    return db_notification


def delete_notification(db: Session, notification_id: int):
    db_notification = get_notification(db, notification_id)
    if db_notification:
        db.delete(db_notification)
        db.commit()
    return db_notification
