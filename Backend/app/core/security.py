from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Optional
from app.authorization.auth import decode_token
from app.db.models import HRManager, Company
from app.authorization.auth import is_blacklisted, hr_by_email, company_by_email
from app.utilities.password import verify_password


# Shown in Swagger "Authorize" button as OAuth2
oauth2_company = OAuth2PasswordBearer(tokenUrl="/auth/company/login")
oauth2_hr = OAuth2PasswordBearer(tokenUrl="/auth/hr/login")


def get_current_company(token: str = Depends(oauth2_company))-> Company:
    if is_blacklisted(token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token", headers={"WWW-Authenticate":"Bearer"})
    
    payload = decode_token(token)
    if not payload or "sub" not in payload or payload.get("type") != "company":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token", headers={"WWW-Authenticate": "Bearer"})
    
    company_email = payload["sub"]
    company = company_by_email(company_email)
    if not company:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return company


def get_current_hr(token: str = Depends(oauth2_hr))-> Company:
    if is_blacklisted(token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token", headers={"WWW-Authenticate":"Bearer"})
    
    payload = decode_token(token)
    if not payload or "sub" not in payload or payload.get("type") != "hr":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token", headers={"WWW-Authenticate": "Bearer"})
    
    hr_email = payload["sub"]
    hr = hr_by_email(hr_email)
    if not hr:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return hr



def authentication_company(email: str, password: str) -> Optional[HRManager]:
    company = company_by_email(email)
    if not company or not verify_password(password, company.password):
        return None
    return company



def authentication_hr(email: str, password: str) -> Optional[Company]:
    hr = hr_by_email(email)
    if not hr or not verify_password(password, hr.password):
        return None
    return hr