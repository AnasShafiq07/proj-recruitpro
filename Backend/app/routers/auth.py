from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from app.db.session import get_db
from sqlalchemy.orm import Session
from app.db.models import Company, HRManager
from app.schemas.company import CompanyCreate
from app.schemas.hr_manager import HRManagerCreate, HRManagerUpdate
from app.authorization.auth import create_access_token, create_refresh_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.core.security import authentication_hr, require_role, get_current_hr
from app.utilities.password import hash_password
from app.services.company import create_company
from app.services.hr_manager import create_hr_manager, update_hr_manager
from app.schemas.auth_token import AuthTokenCreate
from datetime import datetime, timezone
from app.services.auth import add_access_token, create_blacklisted_token


router = APIRouter(prefix="/auth", tags=["Authentication"])



@router.post("/company/signup")
def signup_company(comp: CompanyCreate, db: Session = Depends(get_db)):
    comp = create_company(db, comp)
    return comp

@router.post("/admin/signup")
def signup_admin(hr: HRManagerCreate, db: Session = Depends(get_db)):
    hr.password = hash_password(hr.password)
    hr.role = "admin"
    hr = create_hr_manager(db, hr)
    access_token = create_access_token(
    {"sub": hr.email, "type": "hr"},
    timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
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

@router.post("/hr/logout", status_code=200)
def logout_hr(refresh_token: str = Body(..., embed=True)):
    create_blacklisted_token(refresh_token)
    return {"message": "Successfully logout out"}
