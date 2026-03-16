from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
import json

from app.db import models
from app.schemas.interview import (
    InterviewSlotCreate
)

import uuid
import requests
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.db.models import InterviewSlot, Interview, Candidate, GoogleToken, HRAvailability

def create_slot(db: Session, data: InterviewSlotCreate):
    db_slot = models.InterviewSlot(**data.model_dump())
    db.add(db_slot)
    db.commit()
    db.refresh(db_slot)
    return db_slot

def get_slots(db: Session, availability_id: int) -> List[models.InterviewSlot]:
    return db.query(models.InterviewSlot).filter(models.InterviewSlot.availability_id == availability_id).all()

def mark_slot_booked(db: Session, slot_id: int, interview_id: int):
    slot = db.query(models.InterviewSlot).filter(models.InterviewSlot.id == slot_id).first()
    if not slot:
        return None
    slot.is_booked = True
    slot.interview_id = interview_id
    db.commit()
    db.refresh(slot)
    return slot


def get_google_headers(db: Session, hr_id: int):
    token = db.query(GoogleToken).filter(GoogleToken.hr_id == hr_id).first()
    if not token:
        raise HTTPException(status_code=400, detail="HR Google Calendar not linked")
    return {"Authorization": f"Bearer {token.access_token}", "Content-Type": "application/json"}

def create_google_calendar_event(db: Session, slot: InterviewSlot, candidate_email: str, hr_id: int):
    headers = get_google_headers(db, hr_id)
    
    # 1. Format date
    date_str = slot.date.strftime("%Y-%m-%d")
    
    # 2. IMPORTANT: Remove the 'Z' from the end of the string.
    # Google will use the 'timeZone' field below to interpret these values.
    start_time = f"{date_str}T{slot.start_time}:00"
    end_time = f"{date_str}T{slot.end_time}:00"

    # 3. Use your local TimeZone (Asia/Karachi for PKT)
    local_tz = "Asia/Karachi"

    event_data = {
        "summary": "Job Interview Invitation - RecruitPro",
        "description": "You have been invited to an interview. Please click the link below to join the meeting at the scheduled time.",
        "start": {
            "dateTime": start_time, 
            "timeZone": local_tz
        },
        "end": {
            "dateTime": end_time, 
            "timeZone": local_tz
        },
        "attendees": [
            {"email": candidate_email}
        ],
        "conferenceData": {
            "createRequest": {
                "requestId": str(uuid.uuid4()),
                "conferenceSolutionKey": {"type": "hangoutsMeet"}
            }
        }
    }

    # API URL with parameters to enable Meet links and send email notifications
    api_url = "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all"

    response = requests.post(
        api_url,
        headers=headers,
        json=event_data
    )
    
    if response.status_code not in [200, 201]:
        # Detailed logging for debugging
        error_info = response.json()
        print(f"Google API Error: {error_info}")
        raise HTTPException(status_code=response.status_code, detail=error_info)
    
    return response.json()