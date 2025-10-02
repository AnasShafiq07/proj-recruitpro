import os
from datetime import datetime
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
import chromadb

from app.db import models
from app.analyzer.extractor import extract_text
from app.services.resume_parsing import save_resume_parsing

# Upload folder
UPLOAD_FOLDER = "uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Model (reuse single model instance)
model = SentenceTransformer("all-MiniLM-L6-v2")

# Chroma client + collection
chroma_client = chromadb.Client()  # default in-memory/persist depends on your chroma setup
# Use a single collection for resumes
resume_collection = chroma_client.get_or_create_collection("resumes",
                                                           metadata={"hnsw:space": "cosine"})


def add_resume_to_chroma(parsing_id: int, parsed_text: str, candidate_id: int, job_id: int):
    """Encode parsed_text and add to chroma with metadata."""
    # encode full resume text
    emb = model.encode([parsed_text])[0].tolist()
    resume_collection.add(
        ids=[f"resume_{parsing_id}"],
        embeddings=[emb],
        metadatas=[{"parsing_id": parsing_id, "candidate_id": candidate_id, "job_id": job_id}],
    )


def upload_and_store_resume(db: Session, candidate_id: int, job_id: int, upload_file) -> Dict[str, Any]:
    """
    Save file on disk, extract text, save ResumeParsing row and add embedding to Chroma.
    upload_file is a Starlette UploadFile-like object (has .filename and .file.read()).
    """
    filename = upload_file.filename
    file_path = os.path.join(UPLOAD_FOLDER, filename)

    # Save file
    with open(file_path, "wb") as f:
        f.write(upload_file.file.read())

    # Extract text
    parsed_text = extract_text(file_path) or ""

    # (Optional) You can implement simple placeholders for skills/education extraction here.
    # For now keep them None — you can fill later with better NLP.
    parsing = save_resume_parsing(
        db=db,
        candidate_id=candidate_id,
        job_id=job_id,
        parsed_text=parsed_text,
        skills_extracted=None,
        experience_extracted=None,
        education_extracted=None,
    )

    # Add embedding to chroma
    add_resume_to_chroma(parsing.parsing_id, parsed_text, candidate_id, job_id)

    return {"parsing_id": parsing.parsing_id, "filename": filename}


def match_job_with_resumes(
    db: Session,
    job_id: int,
    top_k: int = 20
) -> Dict[str, Any]:
    """
    1) Retrieve job text & weights
    2) Query Chroma for top_k candidates (full-text embedding)
    3) For those candidates, compute detailed scores (skills/exp/edu + full)
    4) Save ResumeJobMatch rows and return ranked results
    """
    job = db.query(models.Job).filter(models.Job.job_id == job_id).first()
    if not job:
        return {"error": "job_not_found"}

    # job text for full embedding
    job_text = (job.description or "") + " " + (job.requirements or "")
    job_emb_full = model.encode([job_text])

    # Query chroma for top_k resumes by full-text similarity
    query_results = resume_collection.query(
        query_embeddings=job_emb_full.tolist(),
        n_results=top_k,
        include=["metadatas", "distances", "ids"]
    )

    # query_results structure: dict with keys ids, metadatas, distances
    ids = query_results.get("ids", [[]])[0]
    metadatas = query_results.get("metadatas", [[]])[0]
    distances = query_results.get("distances", [[]])[0]

    # If chroma returns nothing
    if not ids:
        return {"job_id": job_id, "ranked_results": []}

    results = []
    # For each returned resume, fetch parsing row and compute category scores
    for idx, meta in enumerate(metadatas):
        parsing_id = meta.get("parsing_id")
        candidate_id = meta.get("candidate_id")

        parsing = db.query(models.ResumeParsing).filter(models.ResumeParsing.parsing_id == parsing_id).first()
        if not parsing:
            continue

        # Prepare texts
        resume_text = (parsing.parsed_text or "")
        resume_skills = parsing.skills_extracted or ""
        resume_exp = parsing.experience_extracted or ""
        resume_edu = parsing.education_extracted or ""

        # Compute scores: if field empty → score = 0.0 (you can decide fallback)
        skill_score = 0.0
        exp_score = 0.0
        edu_score = 0.0
        full_score = 0.0

        # Full score: we can derive from chroma distance OR compute again with SBERT
        # chroma.distance is typically 1 - cosine for cosine space but depends on setup.
        # We'll compute full_score with SBERT for consistency.
        if resume_text:
            resume_full_emb = model.encode([resume_text])
            full_score = float(cosine_similarity(job_emb_full, resume_full_emb)[0][0])

        # Skills: if job.requirements present treat as skills text; else fallback to job.description
        if (parsing.skills_extracted or "") and (job.requirements or ""):
            job_skills_emb = model.encode([job.requirements])
            resume_skills_emb = model.encode([resume_skills])
            skill_score = float(cosine_similarity(job_skills_emb, resume_skills_emb)[0][0])

        # Experience
        if (parsing.experience_extracted or "") and (job.description or ""):
            job_exp_emb = model.encode([job.description])
            resume_exp_emb = model.encode([resume_exp])
            exp_score = float(cosine_similarity(job_exp_emb, resume_exp_emb)[0][0])

        # Education
        if (parsing.education_extracted or "") and (job.requirements or ""):
            job_edu_emb = model.encode([job.requirements])
            resume_edu_emb = model.encode([resume_edu])
            edu_score = float(cosine_similarity(job_edu_emb, resume_edu_emb)[0][0])

        # Use job specific weights (ensure they sum to ~1; if not, we trust their values)
        s_w = getattr(job, "skill_weight", 0.35) or 0.0
        e_w = getattr(job, "experience_weight", 0.25) or 0.0
        ed_w = getattr(job, "education_weight", 0.15) or 0.0
        f_w = getattr(job, "full_resume_weight", 0.25) or 0.0

        final_score = (s_w * skill_score) + (e_w * exp_score) + (ed_w * edu_score) + (f_w * full_score)

        # Save ResumeJobMatch
        match = models.ResumeJobMatch(
            candidate_id=candidate_id,
            job_id=job_id,
            similarity_score=final_score,
            created_at=datetime.utcnow()
        )
        db.add(match)

        results.append({
            "parsing_id": parsing_id,
            "candidate_id": candidate_id,
            "skills_score": round(skill_score, 4),
            "experience_score": round(exp_score, 4),
            "education_score": round(edu_score, 4),
            "full_resume_score": round(full_score, 4),
            "final_score": round(final_score, 4),
            "chroma_distance": distances[idx] if idx < len(distances) else None
        })

    db.commit()

    # rank by final_score
    ranked = sorted(results, key=lambda x: x["final_score"], reverse=True)
    for i, r in enumerate(ranked):
        r["rank"] = i + 1

    return {"job_id": job_id, "ranked_results": ranked}
