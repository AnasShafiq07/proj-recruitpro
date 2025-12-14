import re
import spacy
from typing import Tuple, Optional, List
from datetime import datetime
from dateutil import parser as date_parser

# ✅ Load medium model
try:
    nlp = spacy.load("en_core_web_md")
except:
    nlp = spacy.load("en_core_web_sm")

# ✅ New Regex to find Date Ranges (e.g., "Jan 2019 - Present" or "05/2020 – 06/2022")
DATE_RANGE_PATTERN = re.compile(
    r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s?\d{4}|\d{1,2}[/-]\d{4})"  # Start Date
    r"\s*(?:-|–|to)\s*"  # Separator
    r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s?\d{4}|\d{1,2}[/-]\d{4}|Present|Current|Now)", # End Date
    re.IGNORECASE
)

EDU_PATTERN = re.compile(
    r"(Bachelor|Master|Ph\.?D|B\.Sc|M\.Sc|MBA|B\.Tech|M\.Tech|BS|MS|Diploma|Associate|Intermediate|High School)",
    re.IGNORECASE
)

SKILL_KEYWORDS = [
    "python", "java", "c++", "javascript", "react", "node", "django", "flask", "fastapi",
    "sql", "mysql", "mongodb", "docker", "aws", "azure", "git", "html", "css",
    "machine learning", "data analysis", "deep learning", "communication", "leadership",
    "problem solving", "negotiation", "documentation", "legal drafting", "financial analysis",
    "public speaking", "marketing", "sales", "project management", "teamwork",
    "research", "presentation", "strategic planning", "decision making"
]

def parse_date(date_str: str) -> datetime:
    """Helper to parse varied date string formats."""
    date_str = date_str.lower().strip()
    if date_str in ["present", "current", "now"]:
        return datetime.now()
    try:
        return date_parser.parse(date_str)
    except:
        return None

def extract_experience(text: str) -> Optional[str]:
    """
    ✅ Calculates total months of experience by summing valid date ranges.
    Returns: String like "5.2" (years)
    """
    matches = DATE_RANGE_PATTERN.findall(text)
    total_months = 0
    
    for start_str, end_str in matches:
        start_date = parse_date(start_str)
        end_date = parse_date(end_str)
        
        if start_date and end_date and end_date > start_date:
            months = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
            if 0 < months < 120: # Sanity check: ignore ranges > 10 years (likely errors)
                total_months += months
    
    if total_months > 0:
        years = round(total_months / 12, 1)
        return str(years)
    
    # Fallback to old regex if no date ranges found
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

    # Keyword-based detection
    for skill in SKILL_KEYWORDS:
        if skill in text_lower:
            found_skills.append(skill.title())

    # NLP-based detection
    doc = nlp(text)
    for chunk in doc.noun_chunks:
        if len(chunk.text.split()) <= 4:
            found_skills.append(chunk.text.strip().title())

    for ent in doc.ents:
        if ent.label_ in ["ORG", "PRODUCT", "WORK_OF_ART", "FAC", "SKILL"]:
            found_skills.append(ent.text.strip().title())

    unique_skills = sorted(set(found_skills))
    return ", ".join(unique_skills) if unique_skills else None


def extract_resume_fields(text: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    skills = extract_skills(text)
    experience = extract_experience(text)
    education = extract_education(text)
    return skills, experience, education