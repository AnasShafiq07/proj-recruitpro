import re
import spacy
from typing import Tuple, Optional, List

try:
    nlp = spacy.load("en_core_web_md")
except:
    nlp = spacy.load("en_core_web_sm")

# Regex patterns for experience and education
EXP_PATTERN = re.compile(r"(\d+)\s*(?:\+?\s*)?(?:years?|yrs?)\s*(?:of)?\s*experience", re.IGNORECASE)
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


def extract_experience(text: str) -> Optional[str]:
    matches = EXP_PATTERN.findall(text)
    if matches:
        return f"{max(map(int, matches))} years"
    return None


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

    # NLP-based detection — noun chunks & entities
    doc = nlp(text)
    for chunk in doc.noun_chunks:
        if len(chunk.text.split()) <= 4:
            found_skills.append(chunk.text.strip().title())

    for ent in doc.ents:
        if ent.label_ in ["ORG", "PRODUCT", "WORK_OF_ART", "FAC", "SKILL"]:
            found_skills.append(ent.text.strip().title())

    # Clean duplicates
    unique_skills = sorted(set(found_skills))
    return ", ".join(unique_skills) if unique_skills else None


def extract_resume_fields(text: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    
    # Extract skills, experience, and education from any resume text.
    # Works across multiple industries and resume styles.
    
    skills = extract_skills(text)
    experience = extract_experience(text)
    education = extract_education(text)
    return skills, experience, education
