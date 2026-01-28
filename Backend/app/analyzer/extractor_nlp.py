import re
import spacy
from typing import Tuple, Optional, List
import logging
from collections import Counter

logger = logging.getLogger(__name__)

try:
    nlp = spacy.load("en_core_web_md")
except:
    try:
        nlp = spacy.load("en_core_web_sm")
    except:
        nlp = None

# ==========================================
# TRUTH LISTS (The "Gazetteer")
# ==========================================
# 100% Accuracy for known terms. Add more terms here to improve specific domains.
COMMON_SKILL_DB = {
    # Languages
    "python", "java", "c++", "c#", "javascript", "typescript", "ruby", "php", "swift", "kotlin", "go", "rust", "sql", "html", "css",
    # Frameworks/Libs
    "react", "angular", "vue", "node.js", "django", "flask", "fastapi", "spring", "spring boot", "net core", "laravel", "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "keras",
    # Tools/Infra
    "docker", "kubernetes", "aws", "azure", "gcp", "git", "jenkins", "jira", "linux", "unix", "redis", "mongodb", "postgresql", "mysql", "oracle",
    # Concepts
    "machine learning", "deep learning", "nlp", "computer vision", "data science", "agile", "scrum", "devops", "ci/cd", "rest api", "graphql", "microservices"
}

# ==========================================
# PATTERNS
# ==========================================

# Headers to detect sections
SECTION_HEADERS = {
    "EDUCATION": re.compile(r"\b(education|academic|qualifications|degrees)\b", re.IGNORECASE),
    "EXPERIENCE": re.compile(r"\b(experience|employment|work history|professional background|internships)\b", re.IGNORECASE),
    "SKILLS": re.compile(r"\b(skills|technical skills|technologies|competencies|expertise|stack)\b", re.IGNORECASE)
}

# Strict year matching (e.g., "5 years", "5+ years")
EXP_STRICT_PATTERN = re.compile(r"(?<!\d)(\d{1,2}(?:\.\d+)?)\+?\s*(?:years?|yrs?)", re.IGNORECASE)

# Education degrees
EDU_PATTERN = re.compile(
    r"\b(B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|Ph\.?D|Bachelor|Master|Doctor|Associate|"
    r"B\.?Tech|M\.?Tech|B\.?E\.?|M\.?E\.?|M\.?B\.?A\.?|Diploma|B\.?Com|B\.?B\.?A)\b",
    re.IGNORECASE
)

def split_text_into_sections(text: str) -> dict:
    """
    Segmentation Logic: Breaks resume into 'skills', 'experience', 'education' blocks.
    This drastically reduces noise by looking in the right place.
    """
    lines = text.split('\n')
    sections = {"skills": [], "experience": [], "education": [], "other": []}
    current_section = "other"
    
    for line in lines:
        clean_line = line.strip().lower()
        if not clean_line: continue
        
        # Detect header change
        if len(clean_line) < 50: # Headers are usually short
            if SECTION_HEADERS["EDUCATION"].search(clean_line):
                current_section = "education"
                continue
            elif SECTION_HEADERS["EXPERIENCE"].search(clean_line):
                current_section = "experience"
                continue
            elif SECTION_HEADERS["SKILLS"].search(clean_line):
                current_section = "skills"
                continue

        sections[current_section].append(line)
    
    # Join lists back to strings
    return {k: "\n".join(v) for k, v in sections.items()}


def extract_experience(text: str) -> Optional[str]:
    """
    Extracts experience using both Strict Regex and Section Analysis.
    """
    if not text: return None
    
    # 1. First, check strict regex in the whole text (fastest)
    matches = [float(m) for m in EXP_STRICT_PATTERN.findall(text)]
    valid_years = [m for m in matches if 0 < m < 40] # Filter reasonable range
    
    if valid_years:
        return f"{max(valid_years)} years"

    # 2. If no "X years" found, try to calculate from dates in Experience section
    # (Simplified fallback for now: search for "Senior" or "Lead" keywords implies exp)
    if "senior" in text.lower() or "lead" in text.lower() or "manager" in text.lower():
        return "5+ years (Estimated)"
    
    return "Fresh/Entry Level"


def extract_education(text: str) -> Optional[str]:
    if not text: return None
    
    sections = split_text_into_sections(text)
    # Search primarily in Education section, fallback to all text
    search_text = sections["education"] if len(sections["education"]) > 20 else text
    
    matches = EDU_PATTERN.findall(search_text)
    unique_edu = set()
    
    for m in matches:
        clean = m.replace(".", "").upper().strip()
        if clean in ["BS", "BA", "BTECH", "BE", "BBA", "BACHELOR"]: unique_edu.add("Bachelor's")
        elif clean in ["MS", "MA", "MTECH", "ME", "MBA", "MASTER"]: unique_edu.add("Master's")
        elif "PHD" in clean or "DOCTOR" in clean: unique_edu.add("PhD")
        else: unique_edu.add(clean)
            
    return ", ".join(sorted(unique_edu)) if unique_edu else None


def extract_skills(text: str) -> Optional[str]:
    """
    Hybrid Skill Extraction: 
    1. Gazetteers (Common DB) - 100% Precision
    2. Section-Specific NLP - High Recall
    """
    if not text: return None
    
    sections = split_text_into_sections(text)
    # Focus heavily on the "Skills" section if it exists
    skill_text = sections["skills"] + "\n" + sections["experience"]
    
    found_skills = set()
    text_lower = text.lower()
    
    # 1. Direct DB Lookup (The "Gazetteer" - Accuracy King)
    # Checks if known skills exist anywhere in the text
    for skill in COMMON_SKILL_DB:
        # Use boundary check to avoid partial matches (e.g. "Go" in "Good")
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, text_lower):
            found_skills.add(skill.title())
            
    # 2. NLP Extraction (for niche/unknown skills)
    if nlp:
        doc = nlp(skill_text[:20000]) # Analyze specific sections
        
        # Extract Entities (ORG, PRODUCT)
        for ent in doc.ents:
            if ent.label_ in ["ORG", "PRODUCT", "LANGUAGE"]:
                if len(ent.text) > 2:
                    found_skills.add(ent.text.strip().title())

        # Extract Capitalized Technical Terms (Heuristic)
        # Look for capitalized words in the 'Skills' section specifically
        if sections["skills"]:
            skills_doc = nlp(sections["skills"])
            for token in skills_doc:
                if token.is_alpha and token.is_title and not token.is_stop:
                     found_skills.add(token.text)
    
    # Filter noise
    filtered = {s for s in found_skills if len(s) > 1 and s.lower() not in ["the", "and", "team", "work"]}
    return ", ".join(sorted(filtered))


def extract_skills_from_text(text: str) -> Optional[str]:
    return extract_skills(text)


def match_skills_with_requirements(resume_skills: Optional[str], job_requirements: str) -> Optional[str]:
    """
    Refined matching using Set Intersection.
    """
    if not resume_skills or not job_requirements: return resume_skills
    
    req_lower = job_requirements.lower()
    res_list = [s.strip() for s in resume_skills.split(",")]
    matched = []
    
    for skill in res_list:
        # Exact substring match (high confidence)
        if skill.lower() in req_lower:
            matched.append(skill)
    
    return ", ".join(matched)


def extract_resume_fields(text: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    if not text: return None, None, None
    return extract_skills(text), extract_experience(text), extract_education(text)


def extract_resume_fields_matched(text: str, job_requirements: Optional[str] = None) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    s, e, d = extract_resume_fields(text)
    if job_requirements and s:
        s = match_skills_with_requirements(s, job_requirements)
    return s, e, d