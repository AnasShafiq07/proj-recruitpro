import os
from typing import Dict, Any

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session

from app.db import models
from app.analyzer.extractor import extract_text

# =====================================
# ML Model (single instance)
# =====================================
model = SentenceTransformer("all-MiniLM-L6-v2")


# =====================================
# Helper: create or get ResumeParsing row
# =====================================
def get_or_create_resume_parsing(db: Session, candidate_id: int) -> models.ResumeParsing:
    """
    Fetch ResumeParsing for candidate_id if exists,
    else create a new row with empty sections.
    """
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
# MAIN FUNCTION
# =====================================
# Generate AI scores for all candidates of a job
def generate_ai_scores_for_job(db: Session, job_id: int) -> Dict[str, Any]:
    """
    For a given job_id:
    - Fetch all candidates from the DB
    - Use candidate.resume_url to read their resume
    - Compute AI score using Job.skills_weight and Job.experience_weight
    - Save AI score in ResumeParsing.ai_score and Candidate.ai_score
    """

    job = db.query(models.Job).filter(models.Job.job_id == job_id).first()
    if not job:
        return {"error": "job_not_found"}

    candidates = db.query(models.Candidate).filter(
        models.Candidate.job_id == job_id
    ).all()

    if not candidates:
        return {"error": "no_candidates_found_for_job"}

    processed = 0

    # Job embedding
    job_text = f"{job.title} {job.description or ''} {job.requirements or ''}"
    job_embedding = model.encode([job_text])

    for candidate in candidates:
        # ----------------------------
        # Get resume file path from URL
        # ----------------------------
        if not candidate.resume_url:
            print(f"No resume URL for candidate {candidate.candidate_id}")
            continue

        filename = os.path.basename(candidate.resume_url)
        file_path = os.path.join("app", "static", "resumes", filename)

        if not os.path.exists(file_path):
            print(f"Resume file not found for candidate {candidate.candidate_id}: {file_path}")
            continue

        # ----------------------------
        # Extract resume text
        # ----------------------------
        resume_text = extract_text(file_path) or ""

        # ----------------------------
        # Get or create ResumeParsing row
        # ----------------------------
        parsing = get_or_create_resume_parsing(db, candidate_id=candidate.candidate_id)

        # ----------------------------
        # Embeddings
        # ----------------------------
        resume_emb = model.encode([resume_text])
        skills_emb = model.encode([parsing.skills_extracted]) if parsing.skills_extracted else None
        exp_emb = model.encode([parsing.experience_extracted]) if parsing.experience_extracted else None

        # ----------------------------
        # Similarity scores (0–1)
        # ----------------------------
        full_score = float(cosine_similarity(job_embedding, resume_emb)[0][0])
        skills_score = float(
            cosine_similarity(model.encode([job.requirements]), skills_emb)[0][0]
        ) if skills_emb is not None else 0
        experience_score = float(
            cosine_similarity(model.encode([job.description]), exp_emb)[0][0]
        ) if exp_emb is not None else 0

        # ----------------------------
        # FINAL AI SCORE (weighted)
        # ----------------------------
        ai_score = (
            (job.skills_weight or 0) * skills_score +
            (job.experience_weight or 0) * experience_score +
            full_score
        ) / ((job.skills_weight or 0) + (job.experience_weight or 0) + 1)

        ai_score = round(ai_score * 10000, 2)

        # ----------------------------
        # Save scores
        # ----------------------------
        parsing.ai_score = ai_score
        candidate.ai_score = int(ai_score)
        print(f"Candidate {candidate.candidate_id} AI Score: {ai_score}")
        db.commit()
        processed += 1

    return {
        "job_id": job_id,
        "processed_candidates": processed,
        "status": "ai_scores_generated_successfully"
    }
#=====================================