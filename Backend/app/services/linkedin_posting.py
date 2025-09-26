from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.db.models import LinkedInToken

def create_or_update_linkedin_token(
    db: Session,
    hr_id: int,
    user_id: str,
    urn: str,
    access_token: str,
    expires_in: int,
    refresh_token: str = None
):
    token = db.query(LinkedInToken).filter_by(hr_id=hr_id).first()
    expiry = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

    if token:
        token.access_token = access_token
        token.expires_at = expiry
        token.refresh_token = refresh_token
        token.urn = urn
        token.user_id = user_id
    else:
        token = LinkedInToken(
            hr_id=hr_id,
            user_id=user_id,
            urn=urn,
            access_token=access_token,
            expires_at=expiry,
            refresh_token=refresh_token,
        )
        db.add(token)

    db.commit()
    db.refresh(token)
    return token


def get_linkedin_token(db: Session, hr_id: int):
    return db.query(LinkedInToken).filter_by(hr_id=hr_id).first()


def delete_linkedin_token(db: Session, hr_id: int):
    token = db.query(LinkedInToken).filter_by(hr_id=hr_id).first()
    if token:
        db.delete(token)
        db.commit()
    return token
