from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import uuid, requests, os

from app.db.session import get_db
from app.db.models import HRManager
from app.services.google_calendar import create_or_update_google_token, get_google_token

router = APIRouter(prefix="/google", tags=["Google Calendar & Meet"])

CLIENT_ID = "399949611293-quv3hng1fe6mhnj3qin5e6rukk62vilr.apps.googleusercontent.com"
CLIENT_SECRET = "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"
REDIRECT_URI = "http://localhost:8000/google/auth/callback"

SCOPES = "openid email profile https://www.googleapis.com/auth/calendar"

# -----------------------
# Step 1: Google Login
# -----------------------
@router.get("/auth/login/{hr_id}")
def login_google(hr_id: int, db: Session = Depends(get_db)):
    hr = db.query(HRManager).filter_by(id=hr_id).first()
    if not hr:
        raise HTTPException(status_code=404, detail="HR Manager not found")

    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?response_type=code&client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&scope={SCOPES}"
        f"&access_type=offline&prompt=consent"
        f"&state={hr_id}"
    )
    return RedirectResponse(google_auth_url)

# -----------------------
# Step 2: OAuth Callback
# -----------------------
@router.get("/auth/callback")
def auth_callback(request: Request, code: str = None, error: str = None, state: int = None, db: Session = Depends(get_db)):
    if error:
        raise HTTPException(status_code=400, detail=f"OAuth error: {error}")
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    hr_id = state

    # Exchange code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "grant_type": "authorization_code"
    }

    resp = requests.post(token_url, data=data)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.json())

    token_data = resp.json()
    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in")

    # Fetch user info
    userinfo_resp = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    if userinfo_resp.status_code != 200:
        raise HTTPException(status_code=userinfo_resp.status_code, detail=userinfo_resp.json())

    userinfo = userinfo_resp.json()
    user_id = userinfo["sub"]
    email = userinfo.get("email")
    name = userinfo.get("name")

    # Save tokens in DB (service function you’ll implement)
    token = create_or_update_google_token(
        db=db,
        hr_id=hr_id,
        user_id=user_id,
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in
    )

    return {
        "message": "Google login successful",
        "hr_id": hr_id,
        "name": name,
        "email": email,
        "expires_at": token.expires_at
    }

# -----------------------
# Step 3: Auth Status
# -----------------------
@router.get("/auth/status/{hr_id}")
def auth_status(hr_id: int, db: Session = Depends(get_db)):
    token = get_google_token(db, hr_id)
    if not token:
        return {"authenticated": False}
    return {
        "authenticated": True,
        "expires_at": token.expires_at,
        "hr_id": hr_id
    }

# -----------------------
# Step 4: Create Calendar Event with Meet
# -----------------------
@router.post("/create_event/{hr_id}")
def create_event(hr_id: int, db: Session = Depends(get_db)):
    token = get_google_token(db, hr_id)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated with Google")

    # Refresh token if needed (not implemented here)
    access_token = token.access_token

    start_time = (datetime.utcnow() + timedelta(days=1)).isoformat() + "Z"
    end_time = (datetime.utcnow() + timedelta(days=1, hours=1)).isoformat() + "Z"

    event = {
        "summary": "Project Meeting",
        "description": "Discuss updates",
        "start": {"dateTime": start_time, "timeZone": "UTC"},
        "end": {"dateTime": end_time, "timeZone": "UTC"},
        "attendees": [{"email": "recipient@example.com"}],
        "conferenceData": {
            "createRequest": {"requestId": str(uuid.uuid4())}
        }
    }

    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    create_resp = requests.post(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
        headers=headers,
        json=event
    )

    if create_resp.status_code not in [200, 201]:
        raise HTTPException(status_code=create_resp.status_code, detail=create_resp.json())

    created_event = create_resp.json()
    return {
        "eventId": created_event["id"],
        "meetLink": created_event.get("hangoutLink"),
        "htmlLink": created_event.get("htmlLink")
    }
