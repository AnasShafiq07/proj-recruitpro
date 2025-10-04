from sqlalchemy.orm import Session
from typing import List, Optional
from app.db import models
from app.schemas.resume_parsing import (
    ResumeParsingCreate,
    ResumeParsingUpdate,
    ResumeParsingOut
)

import smtplib
from email.mime.text import MIMEText
from sqlalchemy.orm import Session
import requests
from app.db import models

import os
from dotenv import load_dotenv
import google.generativeai as genai


load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")
genai.configure(api_key=GEMINI_API_KEY)


def generate_feedback_with_gemini(prompt: str) -> str:
    """
    Generates feedback using the official Google Generative AI library.
    This is the correct and robust way to do it.
    """
    try:
        # 1. Create the model instance.
        # Using 'gemini-1.5-flash-latest' is recommended to always use the newest version.
        model = genai.GenerativeModel('gemini-1.5-flash-latest')

        # 2. Generate the content
        response = model.generate_content(prompt)
        
        # 3. Return the text directly
        return response.text

    except Exception as e:
        # This will catch any errors from the API and provide clear feedback
        print(f"An error occurred with the Gemini API: {e}")
        raise Exception(f"Gemini API error: {str(e)}")

def generate_and_send_feedback(db: Session, parsing_id: int, hr_id: int):
    parsing = db.query(models.ResumeParsing).filter(models.ResumeParsing.parsing_id == parsing_id).first()
    if not parsing:
        return {"error": "Resume parsing not found"}

    candidate = db.query(models.Candidate).filter(models.Candidate.candidate_id == parsing.candidate_id).first()
    if not candidate:
        return {"error": "Candidate not found"}

    # Build AI prompt
    feedback_prompt = f"""
    Candidate: {candidate.name}
    Skills match: {parsing.skills_extracted}
    Experience match: {parsing.experience_extracted}
    Education match: {parsing.education_extracted}
    Overall AI Score: {parsing.ai_score}%

    Write a short, professional feedback email to the candidate about their resume analysis.
    """

    # Get AI feedback
    #ai_feedback = generate_feedback_with_gemini(feedback_prompt)
    ai_feedback = "good job"


    # ✅ Directly call your FastAPI endpoint for sending email
    email_payload = {
        "hr_id": hr_id,
        "recipient": candidate.email,
        "subject": "Your Resume Analysis Feedback",
        "content": ai_feedback
    }

    response = requests.post("http://localhost:8000/googlesend_email", json=email_payload)

    if response.status_code not in [200, 202]:
        return {"error": "Failed to send email", "details": response.json()}

    return {"success": True, "message": f"Feedback sent to {candidate.email}"}





def create_resume_parsing(db: Session, parsing: ResumeParsingCreate) -> ResumeParsingOut:
    """Create a new resume parsing record."""
    db_parsing = models.ResumeParsing(**parsing.model_dump())
    db.add(db_parsing)
    db.commit()
    db.refresh(db_parsing)
    return ResumeParsingOut.model_validate(db_parsing)


def get_resume_parsing(db: Session, parsing_id: int) -> Optional[ResumeParsingOut]:
    """Get a single resume parsing by ID."""
    db_parsing = db.query(models.ResumeParsing).filter(models.ResumeParsing.parsing_id == parsing_id).first()
    return ResumeParsingOut.model_validate(db_parsing) if db_parsing else None


def get_resume_parsings(db: Session, skip: int = 0, limit: int = 100) -> List[ResumeParsingOut]:
    """Get a list of resume parsings with pagination."""
    db_parsings = db.query(models.ResumeParsing).offset(skip).limit(limit).all()
    return [ResumeParsingOut.model_validate(p) for p in db_parsings]


def update_resume_parsing(db: Session, parsing_id: int, parsing: ResumeParsingUpdate) -> Optional[ResumeParsingOut]:
    """Update an existing resume parsing record."""
    db_parsing = db.query(models.ResumeParsing).filter(models.ResumeParsing.parsing_id == parsing_id).first()
    if not db_parsing:
        return None

    for field, value in parsing.model_dump(exclude_unset=True).items():
        setattr(db_parsing, field, value)

    db.commit()
    db.refresh(db_parsing)
    return ResumeParsingOut.model_validate(db_parsing)


def delete_resume_parsing(db: Session, parsing_id: int) -> bool:
    """Delete a resume parsing record by ID."""
    db_parsing = db.query(models.ResumeParsing).filter(models.ResumeParsing.parsing_id == parsing_id).first()
    if not db_parsing:
        return False

    db.delete(db_parsing)
    db.commit()
    return True
