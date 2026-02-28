import base64
import json
import io
import uuid
import requests
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import urllib.parse

from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from googleapiclient.errors import HttpError
from google.oauth2.credentials import Credentials

from app.db.session import get_db
from app.db.models import HRManager, HRAvailability, GoogleToken
from app.services.google_calendar import create_or_update_google_token, get_google_token, delete_google_token
from app.schemas.google import EventCreate, EmailPayload, SchedulingDetails, OfferLetterPayload
from app.core.security import get_current_hr
from app.services.candidate import schedule_interview, update_meet_link, get_candidates_without_interview
from app.services.hr_availability import get_selected_availability
from app.services.interview import create_interview
from app.services.document_template import create_document_template, get_hr_template, delete_all_hr_templates
from app.services.company import get_company
from app.schemas.interview import InterviewCreate
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from dotenv import load_dotenv
import os

WEEKDAY_MAP = {
    "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
    "Friday": 4, "Saturday": 5, "Sunday": 6
}


router = APIRouter(prefix="/google", tags=["Google Calendar, Meet & Gmail"])

load_dotenv()
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")

SCOPES = "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/documents"


def refresh_google_token(db: Session, hr_id: int, token: GoogleToken):
    #print("Refreshing access token", token.refresh_token)
    token_url = "https://oauth2.googleapis.com/token"
    old_refresh_token = token.refresh_token
    old_user_id = token.user_id

    delete_google_token(db, hr_id)

    data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": old_refresh_token,
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
        user_id=old_user_id,
        access_token=new_access_token,
        refresh_token=old_refresh_token,
        expires_in=expires_in
    )

    return updated_token



def get_valid_token(db: Session, hr_id: int):
    token: GoogleToken = get_google_token(db, hr_id)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated with google")
    if token.expires_at <= datetime.now(timezone.utc):
        token = refresh_google_token(db, hr_id, token)
    return token


@router.get("/auth/login")
def login_google(db: Session = Depends(get_db), hr: HRManager = Depends(get_current_hr)):
    #hr = get_hr_manager(db, hr_id)
    if not hr:
        raise HTTPException(status_code=404, detail="HR Manager not found")
    
    token = get_google_token(db, hr.id)
    if token:
        delete_google_token(db, hr.id)

    
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?response_type=code&client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&scope={urllib.parse.quote(SCOPES)}"
        f"&access_type=offline&prompt=consent"
        f"&state={hr.id}"
    )
    return {"redirect_url": google_auth_url}

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
    #print(f"expires_at: {token.expires_at}")
    return RedirectResponse(url="http://localhost:8081/settings", status_code=302)

@router.get("/auth/status")
def auth_status(db: Session = Depends(get_db), hr: HRManager = Depends(get_current_hr)):
    token = get_valid_token(db, hr.id)
    if not token or token.expires_at <= datetime.now(timezone.utc):
        return {"authenticated": False}
        
    return {
        "authenticated": True,
        "expires_at": token.expires_at,
        "hr_id": hr.id
    }

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
    schedule_interview(db, event_data.candidate_id)
    update_meet_link(db, event_data.candidate_id, created_event.get("hangoutLink")) 
    return {
        "eventId": created_event["id"],
        "meetLink": created_event.get("hangoutLink"),
        "htmlLink": created_event.get("htmlLink")
    }


@router.post("/schedule_interviews")
def schedule_all_interviews(data: SchedulingDetails,db: Session = Depends(get_db), hr: HRManager = Depends(get_current_hr)):
    availability: HRAvailability = get_selected_availability(db, hr.id)
    if not availability:
        raise HTTPException(status_code=400, detail="HR availability not configured")

    days = json.loads(availability.days)
    duration = timedelta(minutes=availability.duration_minutes)
    break_time = timedelta(minutes=availability.break_minutes)
    start_time = datetime.strptime(availability.start_time, "%H:%M").time()
    end_time = datetime.strptime(availability.end_time, "%H:%M").time()

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


@router.get("/offer-template")
async def get_document_template(
    db: Session = Depends(get_db), 
    hr: HRManager = Depends(get_current_hr)
):
    template = get_hr_template(db, hr.id)
    
    if not template:
        raise HTTPException(
            status_code=404, 
            detail="No offer template found. Please upload one first."
        )
    
    return {
        "template_id": template.template_id,
        "google_doc_id": template.google_doc_id,
        "view_link": f"https://docs.google.com/document/d/{template.google_doc_id}/edit",
        "created_at": template.created_at
    }

@router.post("/upload-template")
async def upload_and_convert_template(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    hr: HRManager = Depends(get_current_hr)
):
    delete_all_hr_templates(db, hr.id)
    allowed_types = [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", # .docx
        "application/pdf"
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload .docx or .pdf")

    try:
        # Ensure HR has a valid Google token and build Credentials
        token_obj = get_valid_token(db, hr.id)
        creds = Credentials(
            token=token_obj.access_token,
            refresh_token=token_obj.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET,
            scopes=["https://www.googleapis.com/auth/drive.file"]
        )

        service = build('drive', 'v3', credentials=creds)

        # 2. Prepare Metadata
        # We tell Google: "Store this as a Google Doc"
        file_metadata = {
            'name': file.filename.rsplit('.', 1)[0], # Remove extension from name
            'mimeType': 'application/vnd.google-apps.document' 
        }

        # 3. Stream the file directly from memory
        file_content = await file.read()
        media = MediaIoBaseUpload(
            io.BytesIO(file_content), 
            mimetype=file.content_type, 
            resumable=True
        )

        # 4. Execute Upload & Conversion
        uploaded_file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id'
        ).execute()

        # Save this ID to your DB to use as a template later
        template_id = uploaded_file.get('id')
        create_document_template(db, hr.id, template_id)
        return {
            "message": "Template uploaded and converted successfully",
            "google_doc_id": template_id
        }

    except HttpError as he:
        # Surface Google API errors for easier debugging
        try:
            content = he.content.decode('utf-8') if hasattr(he, 'content') and he.content else str(he)
            print(f"Upload HttpError: {content}")
            detail = json.loads(content)
        except Exception:
            detail = {'error': str(he)}
        raise HTTPException(status_code=getattr(he, 'resp', {}).status if hasattr(he, 'resp') else 500, detail=detail)
    except Exception as e:
        # Log the error for debugging
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e)})
    


@router.post("/send-offer-letter")
async def send_customized_offer(
    payload: OfferLetterPayload, 
    db: Session = Depends(get_db), 
    hr: HRManager = Depends(get_current_hr)
):
    # 1. Validate Token & Get Template
    token_obj = get_valid_token(db, hr.id)
    template = get_hr_template(db, hr.id)
    if not template:
        raise HTTPException(status_code=404, detail="No offer template found.")

    creds = Credentials(
        token=token_obj.access_token,
        refresh_token=token_obj.refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET
    )

    try:
        drive_service = build('drive', 'v3', credentials=creds)
        docs_service = build('docs', 'v1', credentials=creds)
        gmail_service = build('gmail', 'v1', credentials=creds)

        # 2. Copy the Template to a temporary file
        copy_title = f"Offer_Letter_{payload.candidate_id}_{uuid.uuid4().hex[:6]}"
        cloned_file = drive_service.files().copy(
            fileId=template.google_doc_id,
            body={'name': copy_title}
        ).execute()
        new_doc_id = cloned_file.get('id')

        # 3. Create 'Batch Update' requests for placeholders
        # payload.replacements should look like {"{{salary}}": "5000", "{{role}}": "Dev"}
        requests = [
            {
                'replaceAllText': {
                    'containsText': {'text': key, 'matchCase': True},
                    'replaceText': value,
                }
            } for key, value in payload.replacements.items()
        ]

        docs_service.documents().batchUpdate(
            documentId=new_doc_id, 
            body={'requests': requests}
        ).execute()

        # 4. Export the customized Doc as a PDF
        pdf_content = drive_service.files().export(
            fileId=new_doc_id,
            mimeType='application/pdf'
        ).execute()

        # 5. Prepare Email with Attachment
        company = get_company(db, hr.company_id)
        message = MIMEMultipart()
        message['to'] = payload.candidate_email
        message['subject'] = f"Offer letter from {company.name}"
        
        # Body text
        msg_body = MIMEText(f"Hello,\n\nPlease find your customized offer letter attached.\n\nBest regards,\n{hr.name}")
        message.attach(msg_body)

        # PDF Attachment
        part = MIMEApplication(pdf_content, Name=f"Offer_Letter.pdf")
        part['Content-Disposition'] = f'attachment; filename="Offer_Letter.pdf"'
        message.attach(part)

        # Encode and Send
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
        gmail_service.users().messages().send(
            userId="me", 
            body={'raw': raw_message}
        ).execute()

        # 6. Cleanup: Delete the temporary cloned doc
        #drive_service.files().delete(fileId=new_doc_id).execute()

        return {"status": "success", "message": f"Customized offer sent to {payload.candidate_email}"}

    except Exception as e:
        print(f"Error in Offer Flow: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))