import os
import re
import numpy as np
from typing import Dict, Any

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session

from app.db import models
# ✅ Correct Imports
from app.analyzer.extractor import extract_text
from app.analyzer.extractor_nlp import extract_skills 

# Use MPNet (Best accuracy/speed trade-off)
model = SentenceTransformer("all-mpnet-base-v2")

# =====================================
# Helper: create or get ResumeParsing row
# =====================================
def get_or_create_resume_parsing(db: Session, candidate_id: int) -> models.ResumeParsing:
    parsing = db.query(models.ResumeParsing).filter(models.ResumeParsing.candidate_id == candidate_id).first()
    if parsing: return parsing
    
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
# Helper: Smart Chunking (Max-Over-Chunk)
# =====================================
def get_best_chunk_score(job_embedding: np.ndarray, text: str) -> float:
    """
    Splits resume into chunks, compares Job Embedding vs EACH chunk,
    and returns the HIGHEST similarity found.
    """
    if not text:
        return 0.0
    
    # Split by words
    words = text.split()
    chunk_size = 400
    stride = 200 # Overlap to capture context at boundaries
    chunks = []
    
    if len(words) < chunk_size:
        chunks = [" ".join(words)]
    else:
        for i in range(0, len(words), stride):
            chunk = " ".join(words[i:i + chunk_size])
            chunks.append(chunk)
            if i + chunk_size >= len(words):
                break
    
    if not chunks:
        return 0.0

    # Encode all resume chunks
    chunk_embeddings = model.encode(chunks) # Shape: (num_chunks, 768)
    
    # Calculate cosine similarity of Job vs All Chunks
    similarities = cosine_similarity(job_embedding, chunk_embeddings)
    
    # ✅ Take the MAX score (The best segment of the resume)
    return float(np.max(similarities))

# =====================================
# MAIN FUNCTION
# =====================================
def generate_ai_scores_for_job(db: Session, job_id: int) -> Dict[str, Any]:
    job = db.query(models.Job).filter(models.Job.job_id == job_id).first()
    if not job: return {"error": "job_not_found"}

    candidates = db.query(models.Candidate).filter(models.Candidate.job_id == job_id).all()
    if not candidates: return {"error": "no_candidates_found_for_job"}

    processed = 0

    # 1. Prepare Job Context
    job_full_text = f"{job.title} {job.description or ''} {job.requirements or ''}"
    job_embedding = model.encode([job_full_text]) # Shape: (1, 768)
    
    # 2. Extract Required Years from JD (Regex)
    jd_years_match = re.search(r"(\d+)(?:-|\+)?\s*(?:years?|yrs?)", job.requirements or "", re.IGNORECASE)
    job_years_required = int(jd_years_match.group(1)) if jd_years_match else 1

    for candidate in candidates:
        if not candidate.resume_url: continue
        filename = os.path.basename(candidate.resume_url)
        file_path = os.path.join("app", "static", "resumes", filename)
        if not os.path.exists(file_path): continue

        # Extract Text & Parsing Data
        resume_text = extract_text(file_path) or ""
        parsing = get_or_create_resume_parsing(db, candidate_id=candidate.candidate_id)

        # ----------------------------
        # SCORE 1: Semantic Match (Best Chunk)
        # ----------------------------
        full_score = get_best_chunk_score(job_embedding, resume_text)

        # ----------------------------
        # SCORE 2: Skills Match (Hybrid: Vectors + Exact Bonus)
        # ----------------------------
        # A. Vector Match (Semantic)
        skills_emb = model.encode([parsing.skills_extracted]) if parsing.skills_extracted else np.zeros((1, 768))
        job_req_emb = model.encode([job.requirements]) if job.requirements else np.zeros((1, 768))
        vector_skills_score = float(cosine_similarity(job_req_emb, skills_emb)[0][0])
        
        # B. Exact Keyword Bonus (Precision)
        job_keywords = set(extract_skills(job.requirements).split(", ")) if job.requirements else set()
        cand_keywords = set(parsing.skills_extracted.split(", ")) if parsing.skills_extracted else set()
        
        overlap_count = len(job_keywords.intersection(cand_keywords))
        total_job_kw = len(job_keywords)
        exact_match_bonus = (overlap_count / total_job_kw) if total_job_kw > 0 else 0
        
        # Weighted Average: 70% Semantic, 30% Exact Match
        final_skills_score = (0.7 * vector_skills_score) + (0.3 * exact_match_bonus)

        # ----------------------------
        # SCORE 3: Experience Match (Math Logic)
        # ----------------------------
        try:
            candidate_years = float(parsing.experience_extracted)
        except:
            candidate_years = 0.0
            
        if candidate_years >= job_years_required:
            experience_score = 1.0
        else:
            experience_score = candidate_years / job_years_required

        # ----------------------------
        # FINAL AI SCORE CALCULATION
        # ----------------------------
        w_skill = job.skills_weight or 1
        w_exp = job.experience_weight or 1
        
        # We give slightly higher weight (1.5) to the full semantic match
        ai_score = (
            (w_skill * final_skills_score) +
            (w_exp * experience_score) +
            (1.5 * full_score) 
        ) / (w_skill + w_exp + 1.5)

        # Normalize to 0-100 scale
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