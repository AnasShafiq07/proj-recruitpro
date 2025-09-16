from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import JWSError, JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings
from app.services.auth import is_blacklisted_token
from app.services.company import get_company, get_company_by_email
from app.services.hr_manager import get_hr_by_email, get_hr_manager
from app.db.session import SessionLocal
from app.utilities.password import hash_password, verify_password


SECRET_KEY = settings.JWT_SECRET
ALGORITHM = settings.JWT_ALG
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TTL_MIN
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TTL_DAYS



def is_blacklisted(token):
    db = SessionLocal()
    try:
        blacklisted = is_blacklisted_token(db, token)
    finally:
        db.close()
    return blacklisted


def company_by_id(comp_id: int):
    db = SessionLocal()
    try:
        company = get_company(db, comp_id)
    finally:
        db.close()
    return company

def company_by_email(email: str):
    db = SessionLocal()
    try:
        company = get_company_by_email(db, email)
    finally:
        db.close()
    return company

def hr_by_id(hr_id: int):
    db = SessionLocal()
    try:
        hr = get_hr_manager(db, hr_id)
    finally:
        db.close()
    return hr

def hr_by_email(email: str):
    db = SessionLocal()
    try:
        hr = get_hr_by_email(db, email)
    finally:
        db.close()
    return hr


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": int(expire.timestamp()), "type":"bearer"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)



def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"expire": int(expire.timestamp()), "type":"refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def refresh_access_token(refresh_token: str) -> Optional[str]:
    if is_blacklisted(refresh_token):
        return None
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        return None
    user_data = {"sub": payload.get("sub")}
    new_access_token = create_access_token(user_data)
    return new_access_token