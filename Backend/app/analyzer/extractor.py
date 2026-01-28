import docx2txt
import PyPDF2
import logging
import re
from app.analyzer.extractor_nlp import extract_resume_fields

logger = logging.getLogger(__name__)

def clean_text(text: str) -> str:
    """
    Prepares text for segmentation.
    Ensures headers are on their own lines.
    """
    if not text: return ""
    
    # Normalize newlines
    text = text.replace('\r', '\n')
    
    # Attempt to put headers on new lines if they are stuck to text
    # e.g. "email.comSKILLS" -> "email.com\nSKILLS"
    text = re.sub(r"([a-z0-9])(SKILLS|EXPERIENCE|EDUCATION)", r"\1\n\2", text)
    
    return text.strip()

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    try:
        with open(file_path, "rb") as file:
            reader = PyPDF2.PdfReader(file)
            for page in reader.pages:
                t = page.extract_text()
                if t: text += t + "\n"
    except Exception as e:
        logger.error(f"PDF Error: {str(e)}")
        return ""
    return clean_text(text)

def extract_text_from_docx(file_path: str) -> str:
    try:
        return clean_text(docx2txt.process(file_path) or "")
    except Exception as e:
        logger.error(f"DOCX Error: {str(e)}")
        return ""

def extract_text_from_txt(file_path: str) -> str:
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return clean_text(f.read())
    except Exception:
        return ""

def extract_text(file_path: str) -> str:
    if not file_path: return ""
    ext = file_path.lower().split('.')[-1]
    if ext == "pdf": return extract_text_from_pdf(file_path)
    if ext == "docx": return extract_text_from_docx(file_path)
    if ext == "txt": return extract_text_from_txt(file_path)
    return ""