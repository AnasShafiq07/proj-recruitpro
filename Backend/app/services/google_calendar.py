# app/services/google_calendar.py
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.db.models import GoogleToken

def create_or_update_google_token(db: Session, hr_id: int, user_id: str,
                                  access_token: str, refresh_token: str,
                                  expires_in: int, email: str = None):
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

    token = db.query(GoogleToken).filter_by(hr_id=hr_id).first()

    if token:
        token.user_id = user_id
        token.email = email
        token.access_token = access_token
        if refresh_token:
            token.refresh_token = refresh_token
        token.expires_at = expires_at
    else:
        token = GoogleToken(
            hr_id=hr_id,
            user_id=user_id,
            email=email,
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=expires_at
        )
        db.add(token)

    db.commit()
    db.refresh(token)
    return token


def get_google_token(db: Session, hr_id: int):
    return db.query(GoogleToken).filter_by(hr_id=hr_id).first()


def delete_google_token(db: Session, hr_id: int):
    token = db.query(GoogleToken).filter_by(hr_id=hr_id).first()
    if token:
        db.delete(token)
        db.commit()
        return True
    return False
