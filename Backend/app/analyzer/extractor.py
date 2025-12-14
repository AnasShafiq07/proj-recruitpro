import docx2txt
import pdfplumber  # ✅ Replaces PyPDF2 for better column handling
from app.analyzer.extractor_nlp import extract_resume_fields


def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    # ✅ pdfplumber handles columns (e.g., Skills on left, Work on right) correctly
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text(x_tolerance=1, y_tolerance=1)
            if page_text:
                text += page_text + "\n"
    return text

def extract_text_from_docx(file_path: str) -> str:
    return docx2txt.process(file_path) or ""

def extract_text_from_txt(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8") as file:
        return file.read()

def extract_text(file_path: str) -> str:
    if file_path.lower().endswith(".pdf"):
        return extract_text_from_pdf(file_path)
    elif file_path.lower().endswith(".docx"):
        return extract_text_from_docx(file_path)
    elif file_path.lower().endswith(".txt"):
        return extract_text_from_txt(file_path)
    else:
        return ""