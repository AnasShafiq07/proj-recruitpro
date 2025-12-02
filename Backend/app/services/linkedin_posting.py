from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from app.db.models import LinkedInToken
from fastapi import UploadFile, Form, Request, HTTPException
import os
import requests
import shutil
from fastapi.responses import RedirectResponse

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


def create_linkedin_post(db: Session, apply_link:str, hr_id: int, caption: str = Form(...), image: UploadFile = None):
    token = get_linkedin_token(db, hr_id)
    if not token:
        raise HTTPException(status_code=401, detail="HR Manager not authenticated with LinkedIn")
    
    caption = f"{caption}\n\nApply here: {apply_link}"
    
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


def delete_linkedin_token(db: Session, hr_id: int):
    token = db.query(LinkedInToken).filter_by(hr_id=hr_id).first()
    if token:
        db.delete(token)
        db.commit()
    return token
