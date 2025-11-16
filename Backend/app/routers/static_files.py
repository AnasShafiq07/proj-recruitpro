# resume_router.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
import os
from datetime import datetime

router = APIRouter(prefix="/upload", tags=["Resume Upload"])


# Ensure folder exists
UPLOAD_DIR = "app/static/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/resume")
async def upload_resume(file: UploadFile = File(...)):
    allowed_extensions = ["pdf", "doc", "docx"]
    ext = file.filename.split(".")[-1].lower()

    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Only PDF, DOC, and DOCX files are allowed.")

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{file.filename}"

    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save file locally
    with open(file_path, "wb") as f:
        f.write(await file.read())

    file_url = f"http://127.0.0.1:8000/static/resumes/{filename}"

    return {"message": "Resume uploaded successfully", "url": file_url}
