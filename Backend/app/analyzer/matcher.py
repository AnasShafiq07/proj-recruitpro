import os
from datetime import datetime
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
from chromadb import PersistentClient

from app.db import models
from app.analyzer.extractor import extract_text
from app.services.resume_parsing import save_resume_parsing

# Upload folder
UPLOAD_FOLDER = "uploads"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Model (reuse single model instance)
model = SentenceTransformer("all-MiniLM-L6-v2")

# Persistent Chroma store
chroma_client = PersistentClient(path="./chroma_data")

resume_collection = chroma_client.get_or_create_collection(
    "resumes",
    metadata={"hnsw:space": "cosine"}
)


def add_resume_to_chroma(parsing_id: int, parsed_text: str, candidate_id: int, job_id: int):
    """Encode parsed_text and add to chroma with metadata."""
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

    # Save in DB
    parsing = save_resume_parsing(
        db=db,
        candidate_id=candidate_id,
        job_id=job_id,
        parsed_text=parsed_text,
    )

    # Add embedding to Chroma
    add_resume_to_chroma(parsing.parsing_id, parsed_text, candidate_id, job_id)

    return {"parsing_id": parsing.parsing_id, "filename": filename}


def match_job_with_resumes(db: Session, job_id: int, top_k: int = 20):
    job = db.query(models.Job).filter(models.Job.job_id == job_id).first()
    if not job:
        return {"error": "job_not_found"}

    job_text = f"{job.title} {job.description or ''} {job.requirements or ''} {job.location or ''}"
    job_emb_full = model.encode([job_text])

    query_results = resume_collection.query(
        query_embeddings=job_emb_full.tolist(),
        n_results=top_k,
        include=["metadatas", "distances"]
    )

    metadatas = query_results.get("metadatas", [[]])[0]
    results = []

    for meta in metadatas:
        parsing = db.query(models.ResumeParsing).filter(
            models.ResumeParsing.parsing_id == meta.get("parsing_id")
        ).first()
        if not parsing:
            continue

        resume_text = parsing.parsed_text or ""
        skill_text = parsing.skills_extracted or ""
        exp_text = parsing.experience_extracted or ""
        edu_text = parsing.education_extracted or ""

        # Encode separately
        emb_resume = model.encode([resume_text])
        emb_skill = model.encode([skill_text])
        emb_exp = model.encode([exp_text])
        emb_edu = model.encode([edu_text])

        # Compute similarities (0–1 range)
        full_score = float(cosine_similarity(job_emb_full, emb_resume)[0][0])
        skill_score = float(cosine_similarity(model.encode([job.requirements]), emb_skill)[0][0]) if skill_text else 0
        exp_score = float(cosine_similarity(model.encode([job.description]), emb_exp)[0][0]) if exp_text else 0
        edu_score = float(cosine_similarity(job_emb_full, emb_edu)[0][0]) if edu_text else 0

        # Weighted final score
        s_w, e_w, ed_w, f_w = job.skill_weight, job.experience_weight, job.education_weight, job.full_resume_weight
        final_score = (s_w * skill_score) + (e_w * exp_score) + (ed_w * edu_score) + (f_w * full_score)

        # Convert all to percentages (0–100%)
        results.append({
            "candidate_id": meta.get("candidate_id"),
            "skills_score": round(skill_score * 100, 2),
            "experience_score": round(exp_score * 100, 2),
            "education_score": round(edu_score * 100, 2),
            "full_resume_score": round(full_score * 100, 2),
            "final_score": round(final_score * 100, 2),
        })

    ranked = sorted(results, key=lambda x: x["final_score"], reverse=True)
    for i, r in enumerate(ranked):
        r["rank"] = i + 1

    return {"job_id": job_id, "ranked_results": ranked}
