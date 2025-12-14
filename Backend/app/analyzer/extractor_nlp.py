import re
import spacy
from typing import Tuple, Optional, List
from datetime import datetime
from dateutil import parser as date_parser

# ✅ Load NLP Model
try:
    nlp = spacy.load("en_core_web_md")
except:
    nlp = spacy.load("en_core_web_sm")

# Regex for Date Ranges (e.g., "Jan 2019 - Present")
DATE_RANGE_PATTERN = re.compile(
    r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s?\d{4}|\d{1,2}[/-]\d{4})"  # Start
    r"\s*(?:-|–|to)\s*"
    r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s?\d{4}|\d{1,2}[/-]\d{4}|Present|Current|Now)", # End
    re.IGNORECASE
)

# Regex for Education Degrees
EDU_PATTERN = re.compile(
    r"(Bachelor|Master|Ph\.?D|B\.Sc|M\.Sc|MBA|B\.Tech|M\.Tech|BS|MS|Diploma|Associate|Intermediate|High School)",
    re.IGNORECASE
)

# Expanded Skill List
SKILL_KEYWORDS = [
    "python", "java", "c++", "javascript", "typescript", "react", "angular", "vue", "node", "django", "flask", "fastapi",
    "sql", "mysql", "postgresql", "mongodb", "redis", "docker", "kubernetes", "aws", "azure", "gcp", "terraform",
    "git", "jenkins", "html", "css", "sass", "graphql", "rest api",
    "machine learning", "deep learning", "pytorch", "tensorflow", "data analysis", "pandas", "numpy",
    "scrum", "agile", "jira", "communication", "leadership", "project management"
]

# ✅ NOISE FILTER: Ignore these generic nouns
IGNORE_KEYWORDS = {
    "company", "role", "work", "job", "team", "project", "experience", "year", "month", 
    "responsibility", "manager", "service", "client", "business", "solution", "system", 
    "application", "opportunity", "environment", "task", "result", "time", "date"
}

def parse_date(date_str: str) -> Optional[datetime]:
    """Helper to parse varied date string formats."""
    date_str = date_str.lower().strip()
    if date_str in ["present", "current", "now"]:
        return datetime.now()
    try:
        return date_parser.parse(date_str)
    except:
        return None

def extract_experience(text: str) -> Optional[str]:
    """Calculates total months of experience by summing valid date ranges."""
    matches = DATE_RANGE_PATTERN.findall(text)
    total_months = 0
    
    for start_str, end_str in matches:
        start_date = parse_date(start_str)
        end_date = parse_date(end_str)
        
        if start_date and end_date and end_date > start_date:
            months = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
            # Sanity check: ignore ranges > 10 years (likely parsing errors)
            if 0 < months < 120: 
                total_months += months
    
    if total_months > 0:
        return str(round(total_months / 12, 1))
    
    # Fallback to simple number search
    fallback = re.search(r"(\d+)\s+(?:years?|yrs?)", text, re.IGNORECASE)
    return fallback.group(1) if fallback else "0"

def extract_education(text: str) -> Optional[str]:
    matches = EDU_PATTERN.findall(text)
    if matches:
        return ", ".join(sorted(set([m.title() for m in matches])))
    return None

def extract_skills(text: str) -> Optional[str]:
    text_lower = text.lower()
    found_skills: List[str] = []

    # 1. Exact Match from List
    for skill in SKILL_KEYWORDS:
        if skill in text_lower:
            found_skills.append(skill.title())

    # 2. Smart NLP Extraction
    doc = nlp(text)
    
    # Filter Noun Chunks
    for chunk in doc.noun_chunks:
        clean_chunk = chunk.text.lower().strip()
        # ✅ Filter: Length check + Stopword check
        if 2 < len(clean_chunk) < 30 and clean_chunk not in IGNORE_KEYWORDS:
            # Only add if it looks technical (short phrase)
            if len(clean_chunk.split()) <= 3:
                found_skills.append(chunk.text.strip().title())

    # Filter Entities
    for ent in doc.ents:
        if ent.label_ in ["ORG", "PRODUCT", "WORK_OF_ART", "SKILL", "LANGUAGE"]:
            clean_ent = ent.text.lower().strip()
            if clean_ent not in IGNORE_KEYWORDS:
                found_skills.append(ent.text.strip().title())

    # Deduplicate
    unique_skills = sorted(set(found_skills))
    return ", ".join(unique_skills) if unique_skills else None

def extract_resume_fields(text: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    skills = extract_skills(text)
    experience = extract_experience(text)
    education = extract_education(text)
    return skills, experience, education