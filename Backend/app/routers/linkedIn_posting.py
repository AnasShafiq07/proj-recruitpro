from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, Form, File, Request
from typing import Optional
from fastapi.responses import RedirectResponse
import requests
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import HRManager
from app.services.linkedin_posting import create_or_update_linkedin_token, get_linkedin_token, create_linkedin_post
from app.core.security import get_current_hr

CLIENT_ID = "86s3nqmu4gikyr"
CLIENT_SECRET = "WPL_AP1.dQgSXhTzkUG37rIc.Pbp7yA=="
REDIRECT_URI = "http://localhost:8000/linkedin/auth/callback" 

router = APIRouter(prefix="/linkedin", tags=["Post Jobs to LinkedIn"])


@router.get("/auth/login")
def login_linkedin(db: Session = Depends(get_db), hr: HRManager = Depends(get_current_hr)):
    #hr = db.query(HRManager).filter_by(id=hr_id).first()
    if not hr:
        raise HTTPException(status_code=404, detail="HR Manager not found")

    linkedin_auth_url = (
        "https://www.linkedin.com/oauth/v2/authorization"
        f"?response_type=code&client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        "&scope=openid%20profile%20email%20w_member_social%20w_organization_social%20rw_organization_admin"
        f"&state={hr.id}"
    )
    return {"redirect_url": linkedin_auth_url}


@router.get("/auth/callback")
def auth_callback(request: Request, code: str = None, error: str = None, state: int = None,
    db: Session = Depends(get_db)):
    
    if error:
        raise HTTPException(status_code=400, detail=f"OAuth error: {error}")
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    hr_id = state

    token_url = "https://www.linkedin.com/oauth/v2/accessToken"
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,   
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
    }

    resp = requests.post(
        token_url,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.json())

    token_data = resp.json()
    access_token = token_data["access_token"]
    expires_in = token_data.get("expires_in")

    userinfo_resp = requests.get(
        "https://api.linkedin.com/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    if userinfo_resp.status_code != 200:
        raise HTTPException(status_code=userinfo_resp.status_code, detail=userinfo_resp.json())

    userinfo = userinfo_resp.json()
    user_id = userinfo["sub"]    
    email = userinfo.get("email")
    name = userinfo.get("name")

    token = create_or_update_linkedin_token(db=db, hr_id=hr_id, user_id=user_id,urn=f"urn:li:person:{user_id}", access_token=access_token, expires_in=expires_in)

    #print(f"expries_at: {token.expires_at}")
    return RedirectResponse(url="http://localhost:8082/settings", status_code=302)


@router.get("/auth/status")
def auth_status(db: Session = Depends(get_db), hr: HRManager = Depends(get_current_hr)):
    token = get_linkedin_token(db, hr.id)
    if not token:
        return {"authenticated": False}
    return {
        "authenticated": True,
        "urn": token.urn,
        "expires_at": token.expires_at,
        "hr_id": hr.id
    }


@router.post("/post/")
async def post_to_linkedin(
    apply_link: str = Form(...),
    caption: str = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    hr: HRManager = Depends(get_current_hr),
):
    return create_linkedin_post(db, apply_link, hr.id, caption, image)