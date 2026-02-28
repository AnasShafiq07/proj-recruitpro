from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
import os
import logging
from typing import Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session

from app.db.session import get_db  
from app.db import models
from app.analyzer.extractor import extract_text
from app.analyzer.extractor_nlp import extract_resume_fields, match_skills_with_requirements
from app.analyzer.matcher import (
    calculate_ai_score,
    normalize_weights,
    calculate_semantic_similarity
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/analyzer",
    tags=["Resume Analyzer"])

UPLOAD_DIR = "app/static/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    candidate_id: int = Form(...),
    job_id: int = Form(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Analyze a resume against a job.
    
    Parameters:
    - file: Resume file (PDF, DOCX, TXT)
    - candidate_id: ID of the candidate (required)
    - job_id: ID of the job to match against (required)
    
    Returns:
    - Extracted resume fields (skills, experience, education)
    - AI matching score (0-100)
    - Recommendation
    """
    
    # Validate candidate exists
    job_obj = db.query(models.Job).filter(models.Job.job_id == job_id).first()
    if not job_obj:
        logger.error(f"Job {job_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found"
        )
    
    # Get candidate
    candidate = db.query(models.Candidate).filter(
        models.Candidate.candidate_id == candidate_id
    ).first()
    if not candidate:
        logger.error(f"Candidate {candidate_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate {candidate_id} not found"
        )
    
    # Save resume file with timestamp
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    # Public URL served by FastAPI StaticFiles mount at "/static"
    file_url = f"/static/resumes/{filename}"
    
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
        logger.info(f"Resume saved: {file_path}")
    except Exception as e:
        logger.error(f"Error saving resume: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error saving resume file"
        )
    finally:
        await file.close()
    
    try:
        # Extract resume text
        resume_text = extract_text(file_path)
        if not resume_text.strip():
            logger.warning(f"No text extracted from resume: {filename}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract text from resume"
            )
        
        # Extract resume fields
        skills_extracted, experience_extracted, education_extracted = extract_resume_fields(resume_text)
        
        # Match skills against job requirements
        job_requirements = job_obj.requirements or ""
        if skills_extracted and job_requirements:
            skills_extracted = match_skills_with_requirements(skills_extracted, job_requirements)
        
        # Update candidate with extracted data
        candidate.skills = skills_extracted or candidate.skills
        candidate.experience = experience_extracted or candidate.experience
        candidate.education = education_extracted or candidate.education
        # Store a web-accessible URL (use forward slashes) rather than an OS path
        candidate.resume_url = file_url
        
        # Create or update resume parsing record
        parsing = db.query(models.ResumeParsing).filter(
            models.ResumeParsing.candidate_id == candidate_id
        ).first()
        
        if not parsing:
            parsing = models.ResumeParsing(
                candidate_id=candidate_id,
                skills_extracted=skills_extracted or "",
                experience_extracted=experience_extracted or "",
                education_extracted=education_extracted or ""
            )
            db.add(parsing)
        else:
            parsing.skills_extracted = skills_extracted or ""
            parsing.experience_extracted = experience_extracted or ""
            parsing.education_extracted = education_extracted or ""
        
        # Calculate AI score
        job_text = f"{job_obj.title} {job_obj.description or ''} {job_obj.requirements or ''}"
        weights = normalize_weights(job_obj)
        
        ai_score = calculate_ai_score(
            job_text=job_text,
            resume_text=resume_text,
            skills_extracted=skills_extracted or "",
            experience_extracted=experience_extracted or "",
            job_requirements=job_requirements,
            job_description=job_obj.description or "",
            weights=weights
        )
        
        # Update candidate and parsing with score
        candidate.ai_score = int(ai_score)
        parsing.ai_score = float(ai_score)
        
        db.commit()
        logger.info(f"Resume analyzed for candidate {candidate_id}, Job {job_id}, Score: {ai_score}")
        
        return {
            "status": "success",
            "candidate_id": candidate_id,
            "job_id": job_id,
            "file_name": filename,
            "file_path": file_path,
            "file_url": file_url,
            "job_title": job_obj.title,
            "resume_parsing": {
                "skills": skills_extracted,
                "experience": experience_extracted,
                "education": education_extracted
            },
            "ai_score": ai_score,
            "recommendation": get_recommendation(ai_score)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing resume: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing resume: {str(e)}"
        )


# =====================================
# Helper Functions
# =====================================

def get_recommendation(score: float) -> str:
    """
    Get hiring recommendation based on AI score.
    
    Score ranges:
    - 80-100: Excellent match
    - 70-80: Strong match
    - 60-70: Good match
    - 50-60: Moderate match
    - 40-50: Weak match
    - 0-40: Poor match
    """
    if score >= 80:
        return "Excellent match - Highly recommended for interview"
    elif score >= 70:
        return "Strong match - Recommended for interview"
    elif score >= 60:
        return "Good match - Consider for interview"
    elif score >= 50:
        return "Moderate match - May be worth considering"
    elif score >= 40:
        return "Weak match - Review manually"
    else:
        return "Poor match - Not recommended"

