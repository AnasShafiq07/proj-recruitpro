import os
import logging
from typing import Dict, Any, Set

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
import re

from app.db import models
from app.analyzer.extractor import extract_text
from app.analyzer.extractor_nlp import extract_resume_fields, extract_resume_fields_matched, match_skills_with_requirements

logger = logging.getLogger(__name__)

try:
    model = SentenceTransformer("all-mpnet-base-v2")
except:
    model = SentenceTransformer("all-MiniLM-L6-v2")

def get_or_create_resume_parsing(db: Session, candidate_id: int) -> models.ResumeParsing:
    parsing = db.query(models.ResumeParsing).filter(models.ResumeParsing.candidate_id == candidate_id).first()
    if parsing: return parsing
    
    parsing = models.ResumeParsing(candidate_id=candidate_id, skills_extracted="", experience_extracted="", education_extracted="", ai_score=0.0)
    db.add(parsing)
    db.commit()
    db.refresh(parsing)
    return parsing

def calculate_keyword_coverage(required_text: str, candidate_text: str) -> float:
    """
    The 'Hard Match' Score.
    Extracts keywords from Requirements and checks how many exist in Candidate text.
    Returns 0.0 to 1.0
    """
    if not required_text or not candidate_text: return 0.0
    
  
    stop_words = {'and', 'or', 'the', 'with', 'in', 'of', 'to', 'for', 'a', 'an', 'is', 'are', 'be', 'will', 'must', 'have', 'ability', 'knowledge', 'experience', 'working', 'proficient', 'good', 'strong'}
    
    req_tokens = set(re.findall(r"\b[a-zA-Z#+\.]{2,}\b", required_text.lower()))
    keywords = {w for w in req_tokens if w not in stop_words}
    
    if not keywords: return 0.0
    
    # 2. Check overlap
    cand_lower = candidate_text.lower()
    matches = 0
    for kw in keywords:
        # Boundary match to prevent substring errors (e.g. "R" in "Rest")
        if re.search(r"\b" + re.escape(kw) + r"\b", cand_lower):
            matches += 1
            
    return matches / len(keywords)

def calculate_semantic_similarity(text1: str, text2: str) -> float:
    if not text1 or not text2: return 0.0
    try:
        embeddings = model.encode([text1, text2])
        score = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
        return max(0, min(1, float(score)))
    except:
        return 0.0

def normalize_weights(job) -> Dict[str, float]:
    return {"skills": 0.5, "experience": 0.3, "general": 0.2} # Hardcoded optimal weights

def calculate_ai_score(
    job_text: str,
    resume_text: str,
    skills_extracted: str,
    experience_extracted: str,
    job_requirements: str,
    job_description: str,
    weights: Dict[str, float]
) -> float:
    
    # 1. KEYWORD COVERAGE (The specific "Must Haves") - Weight: 50%
    # This is the most accurate metric. Do they have the words the job asks for?
    req_coverage = calculate_keyword_coverage(job_requirements, resume_text)
    
    # 2. SKILL SIMILARITY (The "Nice to Haves") - Weight: 20%
    # Semantic match of extracted skills block vs requirements
    if skills_extracted and job_requirements:
        skill_sem = calculate_semantic_similarity(job_requirements, skills_extracted)
    else:
        skill_sem = req_coverage # Fallback
        
    # 3. DESCRIPTION MATCH (The "Context") - Weight: 30%
    # Compares full Job Description vs Full Resume (Contextual fit)
    desc_sem = calculate_semantic_similarity(job_description, resume_text)
    
    # 4. WEIGHTED FORMULA
    # We prioritize Coverage because it represents "Missing Requirements"
    final_score = (
        (req_coverage * 0.50) + 
        (skill_sem * 0.20) + 
        (desc_sem * 0.30)
    ) * 100
    
    # Boost for high coverage (Reward "Perfect Candidates")
    if req_coverage > 0.8:
        final_score += 5
        
    return round(min(100, final_score), 2)

def generate_ai_scores_for_job(db: Session, job_id: int) -> Dict[str, Any]:
    # Standard boilerplate execution
    job = db.query(models.Job).filter(models.Job.job_id == job_id).first()
    if not job: return {"error": "job_not_found"}
    
    candidates = db.query(models.Candidate).filter(models.Candidate.job_id == job_id).all()
    if not candidates: return {"error": "no_candidates"}
    
    processed = 0
    failed = 0
    
    # Pre-fetch job data
    job_text = f"{job.title} {job.requirements}"
    job_reqs = job.requirements or ""
    job_desc = job.description or ""
    weights = normalize_weights(job)
    
    for candidate in candidates:
        try:
            if not candidate.resume_url: 
                failed += 1
                continue
                
            fname = os.path.basename(candidate.resume_url)
            fpath = os.path.join("app", "static", "resumes", fname)
            
            if not os.path.exists(fpath):
                failed += 1
                continue
                
            # Extract
            resume_text = extract_text(fpath)
            if not resume_text: 
                failed += 1
                continue
                
            skills, exp, edu = extract_resume_fields(resume_text)
            
            # Match
            matched_skills = match_skills_with_requirements(skills, job_reqs)
            
            # Save Parsing
            parsing = get_or_create_resume_parsing(db, candidate.candidate_id)
            parsing.skills_extracted = matched_skills or ""
            parsing.experience_extracted = exp or ""
            parsing.education_extracted = edu or ""
            
            # Score
            score = calculate_ai_score(
                job_text, resume_text, matched_skills, exp, 
                job_reqs, job_desc, weights
            )
            
            parsing.ai_score = score
            candidate.ai_score = int(score)
            
            candidate.skills = matched_skills or candidate.skills
            candidate.experience = exp or candidate.experience
            candidate.education = edu or candidate.education
            
            db.commit()
            processed += 1
            
        except Exception as e:
            logger.error(f"Failed candidate {candidate.candidate_id}: {e}")
            failed += 1
            continue
            
    return {"status": "success", "processed": processed, "failed": failed}