import base64
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import uuid, requests, os
from email.mime.text import MIMEText
from app.db.session import get_db
from app.db.models import HRManager, HRAvailability, Candidate
from app.services.google_calendar import create_or_update_google_token, get_google_token, delete_google_token
from app.services.hr_manager import get_hr_manager
from app.schemas.google import EventCreate, EmailPayload, SchedulingDetails
from app.core.security import get_current_hr

from app.services.hr_availability import get_availability
import json
from app.services.candidate import get_candidates_without_interview
from app.services.interview import create_interview
from app.schemas.interview import InterviewCreate

WEEKDAY_MAP = {
    "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
    "Friday": 4, "Saturday": 5, "Sunday": 6
}


router = APIRouter(prefix="/google", tags=["Google Calendar, Meet & Gmail"])

CLIENT_ID = "399949611293-quv3hng1fe6mhnj3qin5e6rukk62vilr.apps.googleusercontent.com"
CLIENT_SECRET = "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"
REDIRECT_URI = "http://localhost:8000/google/auth/callback"

SCOPES = "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.send"




def refresh_google_token(db: Session, hr_id: int, token):
    print("Refreshing access token")
    token_url = "https://oauth2.googleapis.com/token"

    data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": token.refresh_token,
        "grant_type": "refresh_token"
    }
    resp = requests.post(token_url, data=data)
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.json())

    token_data = resp.json()
    new_access_token = token_data["access_token"]
    expires_in = token_data["expires_in"]

    updated_token = create_or_update_google_token(
        db=db,
        hr_id=hr_id,
        user_id=token.user_id,
        access_token=new_access_token,
        refresh_token=token.refresh_token,
        expires_in=expires_in
    )
    return updated_token


def get_valid_token(db: Session, hr_id: int):
    token = get_google_token(db, hr_id)

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated with google")
    if token.expires_at <= datetime.now(timezone.utc):
        token = refresh_google_token(db, hr_id, token)
    return token


@router.get("/auth/login/{hr_id}")
def login_google(hr_id: int, db: Session = Depends(get_db)):
    hr = get_hr_manager(db, hr_id)
    if not hr:
        raise HTTPException(status_code=404, detail="HR Manager not found")
    
    token = get_google_token(db, hr_id)
    if token:
        delete_google_token(db, hr_id)

    
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?response_type=code&client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&scope={SCOPES}"
        f"&access_type=offline&prompt=consent"
        f"&state={hr_id}"
    )
    return RedirectResponse(google_auth_url)


@router.get("/auth/callback")
def auth_callback(request: Request, code: str = None, error: str = None, state: int = None, db: Session = Depends(get_db)):
    if error:
        raise HTTPException(status_code=400, detail=f"OAuth error: {error}")
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    hr_id = state

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

@router.get("/auth/status")
def auth_status(db: Session = Depends(get_db), hr: HRManager = Depends(get_current_hr)):
    token = get_google_token(db, hr.id)
    if not token or token.expires_at <= datetime.now(timezone.utc):
        return {"authenticated": False}
        
    return {
        "authenticated": True,
        "expires_at": token.expires_at,
        "hr_id": hr.id
    }

# Create Calendar Event with Meet
@router.post("/create_event")
def create_event(event_data: EventCreate, db: Session = Depends(get_db), hr: HRManager = Depends(get_current_hr)):
    token = get_valid_token(db, hr.id)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated with Google")

    access_token = token.access_token

    start_time = event_data.start_time or (datetime.now(timezone.utc) + timedelta(days=1))
    end_time = event_data.end_time or (start_time + timedelta(hours=1))

    event = {
        "summary": event_data.summary or "Job Meeting",
        "description": event_data.description or "Discuss updates",
        "start": {"dateTime": start_time.isoformat(), "timeZone": "UTC"},
        "end": {"dateTime": end_time.isoformat(), "timeZone": "UTC"},
        "attendees": [{"email": event_data.email}],
        "conferenceData": {
            "createRequest": {
                "requestId": str(uuid.uuid4()),
                "conferenceSolutionKey": {"type": "hangoutsMeet"}
            }
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


@router.post("/schedule_interviews")
def schedule_all_interviews(data: SchedulingDetails,db: Session = Depends(get_db), hr: HRManager = Depends(get_current_hr)):
    availability: HRAvailability = get_availability(db, hr.id)
    if not availability:
        raise HTTPException(status_code=400, detail="HR availability not configured")

    days = json.loads(availability.days)
    duration = timedelta(minutes=availability.duration_minutes)
    break_time = timedelta(minutes=availability.break_minutes)
    start_time = datetime.strptime(availability.start_time, "%H:%M").time()
    end_time = datetime.strptime(availability.end_time, "%H:%M").time()

    # Get all candidates who don't yet have interviews
    candidates = get_candidates_without_interview(db, hr.id, data.job_id)

    if not candidates:
        raise HTTPException(status_code=404, detail="No pending candidates found for interview scheduling")

    # Generate all interview slots
    current_date = availability.start_date.date()
    end_date = availability.end_date.date()
    all_slots = []

    while current_date <= end_date:
        weekday = current_date.weekday()
        weekday_name = list(WEEKDAY_MAP.keys())[weekday]

        if weekday_name in days:
            current_start = datetime.combine(current_date, start_time)
            current_end = datetime.combine(current_date, end_time)

            while current_start + duration <= current_end:
                all_slots.append(current_start)
                current_start += duration + break_time

        current_date += timedelta(days=1)

    if not all_slots:
        raise HTTPException(status_code=400, detail="No valid interview slots found")

    # Get HR's Google token
    token = get_valid_token(db, hr.id)
    access_token = token.access_token
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}

    # Schedule for each candidate
    created_interviews = []
    for i, candidate in enumerate(candidates):
        if i >= len(all_slots):
            break

        slot_start = all_slots[i]
        slot_end = slot_start + duration

        # Create Google Calendar event with Meet
        event = {
            "summary": data.summary,
            "description": data.description,
            "start": {"dateTime": slot_start.isoformat(), "timeZone": "UTC"},
            "end": {"dateTime": slot_end.isoformat(), "timeZone": "UTC"},
            "attendees": [{"email": candidate.email}],
            "conferenceData": {
                "createRequest": {
                    "requestId": str(uuid.uuid4()),
                    "conferenceSolutionKey": {"type": "hangoutsMeet"}
                }
            }
        }

        create_resp = requests.post(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
            headers=headers,
            json=event
        )

        if create_resp.status_code not in [200, 201]:
            raise HTTPException(status_code=create_resp.status_code, detail=create_resp.json())

        created_event = create_resp.json()
        meet_link = created_event.get("hangoutLink")

        # Save interview to DB
        create_interview(db, InterviewCreate(
            candidate_id=candidate.candidate_id,
            job_id=candidate.job_id,
            scheduled_time=slot_start,
            meet_link=meet_link
        ))

        created_interviews.append({
            "candidate": candidate.name,
            "email": candidate.email,
            "time": slot_start.isoformat(),
            "meetLink": meet_link,
            "calendarLink": created_event.get("htmlLink")
        })

    return {
        "total_interviews_scheduled": len(created_interviews),
        "scheduled": created_interviews
    }

@router.post("/send_email")
def send_email(payload: EmailPayload, db: Session = Depends(get_db), hr: HRManager = Depends(get_current_hr)):
    
    token = get_valid_token(db, hr.id)
    if not token:
        raise HTTPException(status_code=401, detail="Hr not authenticated with Google")
    access_token = token.access_token
    message = MIMEText(payload.content)
    message["to"] = payload.recipient
    message["subject"] = payload.subject
    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")

    url = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }  
    body = {"raw": raw_message}
    response = requests.post(url, headers=headers, json=body)

    if response.status_code not in [200, 202]:
        raise HTTPException(status_code=response.status_code, detail=response.json())

    return {
        "message": "Email sent successfully",
        "gmail_response": response.json()
    }