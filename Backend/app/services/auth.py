from sqlalchemy.orm import  Session
from app.db.models import AuthToken, BlacklistedToken
from app.schemas.auth_token import AuthTokenCreate, BlacklistedTokenCreate
from datetime import datetime, timezone



def create_access_token(db: Session, token: AuthTokenCreate):
    db_token = AuthToken(**token.model_dump())
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token

def create_blacklisted_token(db: Session, token: BlacklistedTokenCreate):
    db_token = BlacklistedToken(**token.model_dump())
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token


def is_blacklisted_token(db: Session, token: str)-> bool:
    token = db.query(BlacklistedToken).filter(BlacklistedToken.token == token).first()
    if token is None:
        return False
    return True