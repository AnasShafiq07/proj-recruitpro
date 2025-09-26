from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, Form, Request
from fastapi.responses import RedirectResponse
import requests
from sqlalchemy.orm import Session
import shutil
import os

from app.db.session import get_db
from app.db.models import HRManager
from app.services.linkedin_posting import create_or_update_linkedin_token, get_linkedin_token
from app.core.security import get_current_hr

# LinkedIn App credentials
CLIENT_ID = "86s3nqmu4gikyr"
CLIENT_SECRET = "WPL_AP1.dQgSXhTzkUG37rIc.Pbp7yA=="
REDIRECT_URI = "http://localhost:8000/linkedin/auth/callback" 

router = APIRouter(prefix="/linkedin", tags=["Post Jobs to LinkedIn"])


@router.get("/auth/login/{hr_id}")
def login_linkedin(hr_id: int, db: Session = Depends(get_db)):
    hr = db.query(HRManager).filter_by(id=hr_id).first()
    if not hr:
        raise HTTPException(status_code=404, detail="HR Manager not found")

    linkedin_auth_url = (
        "https://www.linkedin.com/oauth/v2/authorization"
        f"?response_type=code&client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        # Request full scopes needed for posting
        "&scope=openid%20profile%20email%20w_member_social%20w_organization_social%20rw_organization_admin"
        f"&state={hr_id}"
    )
    return RedirectResponse(linkedin_auth_url)


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

    return {
        "message": "Login successful",
        "hr_id": hr_id,
        "name": name,
        "email": email,
        "expires_at": token.expires_at
    }

@router.get("/auth/status/{hr_id}")
def auth_status(hr_id: int, db: Session = Depends(get_db)):
    """Check LinkedIn token status for a specific HR Manager"""
    token = get_linkedin_token(db, hr_id)
    if not token:
        return {"authenticated": False}
    return {
        "authenticated": True,
        "urn": token.urn,
        "expires_at": token.expires_at,
        "hr_id": hr_id
    }


@router.post("/post/{hr_id}")
async def post_to_linkedin(
    hr_id: int,
    caption: str = Form(...),
    image: UploadFile = None,
    db: Session = Depends(get_db)
):
    token = get_linkedin_token(db, hr_id)
    if not token:
        raise HTTPException(status_code=401, detail="HR Manager not authenticated with LinkedIn")

    headers = {
        "Authorization": f"Bearer {token.access_token}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0"
    }

    register_url = "https://api.linkedin.com/v2/assets?action=registerUpload"
    register_body = {
        "registerUploadRequest": {
            "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
            "owner": token.urn,
            "serviceRelationships": [
                {
                    "relationshipType": "OWNER",
                    "identifier": "urn:li:userGeneratedContent"
                }
            ]
        }
    }

    reg_resp = requests.post(register_url, headers=headers, json=register_body)
    if reg_resp.status_code != 200:
        raise HTTPException(status_code=reg_resp.status_code, detail=reg_resp.json())

    reg_data = reg_resp.json()
    upload_url = reg_data["value"]["uploadMechanism"]["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]["uploadUrl"]
    asset = reg_data["value"]["asset"]

    with open(image.filename, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    with open(image.filename, "rb") as f:
        upload_resp = requests.put(upload_url, data=f, headers={"Authorization": f"Bearer {token.access_token}"})

    os.remove(image.filename)

    if upload_resp.status_code not in [200, 201]:
        raise HTTPException(status_code=upload_resp.status_code, detail="Image upload failed")

    post_url = "https://api.linkedin.com/v2/ugcPosts"
    post_body = {
        "author": token.urn,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": caption},
                "shareMediaCategory": "IMAGE",
                "media": [{"status": "READY", "media": asset}]
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    }

    post_resp = requests.post(post_url, headers=headers, json=post_body)
    if post_resp.status_code not in [200, 201]:
        raise HTTPException(status_code=post_resp.status_code, detail=post_resp.json())

    return {"message": "Post created successfully", "response": post_resp.json()}
