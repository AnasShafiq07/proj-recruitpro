from datetime import timedelta, datetime, timezone
import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests

from app.db.session import get_db
from app.db.models import Company, HRManager
from app.schemas.company import CompanyCreate
from app.schemas.hr_manager import HRManagerCreate, HRManagerUpdate
from app.authorization.auth import (
    create_access_token, 
    create_refresh_token, 
    ACCESS_TOKEN_EXPIRE_MINUTES, 
    refresh_access_token
)
from app.core.security import authentication_hr, require_role, get_current_hr
from app.utilities.password import hash_password
from app.services.company import create_company
from app.services.hr_manager import create_hr_manager, update_hr_manager, get_hr_by_email
from app.schemas.auth_token import AuthTokenCreate, GoogleAuthRequest, GoogleSignupRequest
from app.services.auth import add_access_token, create_blacklisted_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


GOOGLE_CLIENT_ID = "399949611293-quv3hng1fe6mhnj3qin5e6rukk62vilr.apps.googleusercontent.com"


def verify_google_token(token: str):
    try:
        id_info = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        if not id_info.get('email_verified'):
            raise ValueError("Email is not verified by Google.")
        return id_info
    except ValueError:
        return None


@router.post("/company/signup")
def signup_company(comp: CompanyCreate, db: Session = Depends(get_db)):
    comp = create_company(db, comp)
    return comp

@router.post("/admin/signup")
def signup_admin(hr: HRManagerCreate, db: Session = Depends(get_db)):
    hr.password = hash_password(hr.password)
    hr.role = "admin"
    hr = create_hr_manager(db, hr)
    
    access_token = create_access_token({"sub": hr.email, "type": "hr"}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    refresh_token = create_refresh_token(data={"sub": hr.email})
    
    token = AuthTokenCreate(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        hr_id=hr.id,
        company_id=hr.company_id
    )
    add_access_token(db, token)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.get("/check-email")
def check_email_exists(email: str, db: Session = Depends(get_db)):
    hr = get_hr_by_email(db, email)
    return True if not hr else False

@router.post("/hr/login")
def login_hr(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    hr = authentication_hr(form_data.username, form_data.password)
    if not hr:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub":hr.email, "type":"hr"}, expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    refresh_token = create_refresh_token(data={"sub": hr.email})
    
    token = AuthTokenCreate(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        hr_id=hr.id,
        company_id=hr.company_id
    )
    add_access_token(db, token)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/google/login")
def login_google(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    google_user = verify_google_token(request.token)
    if not google_user:
        raise HTTPException(status_code=401, detail="Invalid Google Token")
    
    email = google_user['email']
    
    hr = get_hr_by_email(db, email)
    if not hr:
        raise HTTPException(status_code=404, detail="User not found. Please Sign Up first.")

    access_token = create_access_token(data={"sub": hr.email, "type": "hr"}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    refresh_token = create_refresh_token(data={"sub": hr.email})
    
    token_entry = AuthTokenCreate(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        hr_id=hr.id,
        company_id=hr.company_id
    )
    add_access_token(db, token_entry)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/google/signup")
def signup_google(request: GoogleSignupRequest, db: Session = Depends(get_db)):
    google_user = verify_google_token(request.token)
    if not google_user:
        raise HTTPException(status_code=401, detail="Invalid Google Token")
    
    email = google_user['email']
    
    if get_hr_by_email(db, email):
        raise HTTPException(status_code=400, detail="User already exists. Please Login.")

    alphabet = string.ascii_letters + string.digits
    random_password = ''.join(secrets.choice(alphabet) for i in range(20))
    
    hr_in = HRManagerCreate(
        email=email,
        password=hash_password(random_password),
        full_name=google_user.get('name', 'Google User'),
        company_id=request.company_id,
        role=request.role
    )
    
    hr = create_hr_manager(db, hr_in)
    
    access_token = create_access_token(data={"sub": hr.email, "type": "hr"}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    refresh_token = create_refresh_token(data={"sub": hr.email})
    
    token_entry = AuthTokenCreate(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        hr_id=hr.id,
        company_id=hr.company_id
    )
    add_access_token(db, token_entry)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/hr/create-new", dependencies=[Depends(require_role("admin"))])
def signup_hr(hr: HRManagerCreate, db: Session = Depends(get_db)):
    hr.password = hash_password(hr.password)
    hr = create_hr_manager(db, hr)
    return hr

@router.put("/hr/update-info")
def update_hr(updates: HRManagerUpdate, db: Session = Depends(get_db), hr: HRManager = Depends(get_current_hr)):
    updated = update_hr_manager(db, hr.id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Hr not found")
    return updated

@router.post("/refresh")
def refresh_token(refresh_token: str = Body(..., embed=True)):
    new_access_token = refresh_access_token(refresh_token)
    if not new_access_token:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return {
        "access_token": new_access_token,
        "type": "bearer"
    }

@router.post("/hr/logout", status_code=200)
def logout_hr(refresh_token: str = Body(..., embed=True)):
    create_blacklisted_token(refresh_token)
    return {"message": "Successfully logout out"}