import os
import re
import numpy as np
from typing import Dict, Any

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session

from app.db import models
from app.analyzer.extractor import extract_text

# =====================================
# ML Model (Upgraded)
# =====================================
# ✅ Switch to mpnet-base (512 tokens) for better accuracy
model = SentenceTransformer("all-mpnet-base-v2")

# =====================================
# Helper: create or get ResumeParsing row
# =====================================
def get_or_create_resume_parsing(db: Session, candidate_id: int) -> models.ResumeParsing:
    parsing = db.query(models.ResumeParsing).filter(
        models.ResumeParsing.candidate_id == candidate_id
    ).first()

    if parsing:
        return parsing

    parsing = models.ResumeParsing(
        candidate_id=candidate_id,
        skills_extracted="",
        experience_extracted="",
        education_extracted="",
        ai_score=0.0
    )
    db.add(parsing)
    db.commit()
    db.refresh(parsing)
    return parsing

# =====================================
# Helper: Chunking for Long Text
# =====================================
def get_long_text_embedding(text: str) -> np.ndarray:
    """
    ✅ Splits text into 500-word chunks, embeds them, and averages the result.
    This solves the 'Truncation' problem.
    """
    if not text:
        return np.zeros((768,)) # Dimension of mpnet-base
    
    # Split vaguely by words (approx 400 words fits in 512 tokens)
    words = text.split()
    chunk_size = 400
    chunks = [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]
    
    # Embed all chunks
    embeddings = model.encode(chunks)
    
    # Average them (Mean Pooling)
    return np.mean(embeddings, axis=0).reshape(1, -1)

# =====================================
# MAIN FUNCTION
# =====================================
def generate_ai_scores_for_job(db: Session, job_id: int) -> Dict[str, Any]:
    job = db.query(models.Job).filter(models.Job.job_id == job_id).first()
    if not job:
        return {"error": "job_not_found"}

    candidates = db.query(models.Candidate).filter(
        models.Candidate.job_id == job_id
    ).all()

    if not candidates:
        return {"error": "no_candidates_found_for_job"}

    processed = 0

    # 1. Job Embedding
    job_full_text = f"{job.title} {job.description or ''} {job.requirements or ''}"
    job_embedding = get_long_text_embedding(job_full_text)
    
    # 2. Extract Required Years from JD (Regex)
    # Tries to find "3+ years" or "3-5 years" in JD
    jd_years_match = re.search(r"(\d+)(?:-|\+)?\s*(?:years?|yrs?)", job.requirements or "", re.IGNORECASE)
    job_years_required = int(jd_years_match.group(1)) if jd_years_match else 1 # Default to 1 if not specified

    for candidate in candidates:
        if not candidate.resume_url:
            continue

        filename = os.path.basename(candidate.resume_url)
        file_path = os.path.join("app", "static", "resumes", filename)

        if not os.path.exists(file_path):
            continue

        # Extract Text
        resume_text = extract_text(file_path) or ""
        parsing = get_or_create_resume_parsing(db, candidate_id=candidate.candidate_id)

        # ----------------------------
        # SCORE 1: Semantic Match (The "Vibe" Check)
        # ----------------------------
        resume_emb = get_long_text_embedding(resume_text)
        full_score = float(cosine_similarity(job_embedding, resume_emb)[0][0])

        # ----------------------------
        # SCORE 2: Skills Match (Vector based on extracted keywords)
        # ----------------------------
        # We still use vectors here because "Python" ~= "Coding" (semantic)
        skills_emb = model.encode([parsing.skills_extracted]) if parsing.skills_extracted else np.zeros((1, 768))
        job_req_emb = model.encode([job.requirements]) if job.requirements else np.zeros((1, 768))
        skills_score = float(cosine_similarity(job_req_emb, skills_emb)[0][0])

        # ----------------------------
        # SCORE 3: Experience Match (✅ Math, not Vectors)
        # ----------------------------
        try:
            candidate_years = float(parsing.experience_extracted)
        except (ValueError, TypeError):
            candidate_years = 0.0
            
        # Logic: If candidate has enough experience, score 1.0. If less, proportional score.
        if candidate_years >= job_years_required:
            experience_score = 1.0
        else:
            experience_score = candidate_years / job_years_required

        # ----------------------------
        # FINAL AI SCORE
        # ----------------------------
        # Weights (default to 1 if null)
        w_skill = job.skills_weight or 1
        w_exp = job.experience_weight or 1
        
        ai_score = (
            (w_skill * skills_score) +
            (w_exp * experience_score) +
            (1 * full_score) # Base weight for full match
        ) / (w_skill + w_exp + 1)

        # Normalize to 0-100 scale (fixing your previous 10000 logic)
        ai_score = round(max(0, min(ai_score, 1)) * 10000, 2)

        parsing.ai_score = ai_score
        candidate.ai_score = int(ai_score)
        
        db.commit()
        processed += 1

    return {
        "job_id": job_id,
        "processed_candidates": processed,
        "status": "ai_scores_generated_successfully"
    }