# Batch Resume Processing - Implementation Guide

## Overview
Updated the analyzer module to automatically process resumes when submitted and efficiently handle multiple resume submissions from different candidates. The system now supports both single-resume and batch-processing workflows with background task processing.

---

## New Endpoints

### 1. **POST /api/analyzer/batch/upload** - Bulk Resume Upload
Upload and process multiple resumes for a job in background.

**Request:**
```bash
curl -X POST http://localhost:8000/api/analyzer/batch/upload \
  -F "files=@resume1.pdf" \
  -F "files=@resume2.pdf" \
  -F "files=@resume3.pdf" \
  -F "job_id=5"
```

**Response:**
```json
{
  "status": "processing",
  "message": "Processing 3 resumes for job Senior Developer",
  "job_id": 5,
  "total_files": 3,
  "detail": "Resumes are being processed in background. Use batch status endpoint to check progress."
}
```

**Features:**
- ✅ Accept multiple files at once
- ✅ Non-blocking (runs in background)
- ✅ Automatic extraction, analysis, and storage
- ✅ Returns immediately with processing status

### 2. **POST /api/analyzer/batch/process** - Single Immediate Resume Processing
Process a single resume immediately and return results.

**Request:**
```bash
curl -X POST http://localhost:8000/api/analyzer/batch/process \
  -F "file=@resume.pdf" \
  -F "job_id=5" \
  -F "candidate_id=123"  # Optional
```

**Response:**
```json
{
  "status": "success",
  "candidate_id": 123,
  "file_name": "resume.pdf",
  "job_title": "Senior Developer",
  "ai_score": 82.5,
  "recommendation": "Excellent match - Highly recommended for interview",
  "resume_parsing": {
    "skills": "Python, React, Docker, AWS",
    "experience": "5 years",
    "education": "Bachelor"
  }
}
```

**Features:**
- ✅ Immediate processing (blocking)
- ✅ Full result with AI score
- ✅ Auto-creates candidate if not provided
- ✅ Links resume to candidate automatically

### 3. **GET /api/analyzer/job/{job_id}/processing-status** - Batch Processing Status
Monitor processing progress for all candidates of a job.

**Request:**
```bash
curl -X GET http://localhost:8000/api/analyzer/job/5/processing-status
```

**Response:**
```json
{
  "job_id": 5,
  "job_title": "Senior Developer",
  "total_candidates": 25,
  "processed": 25,
  "processing_rate": "100.0%",
  "score_stats": {
    "average": 72.5,
    "highest": 95.3,
    "lowest": 45.2
  },
  "candidates": [
    {
      "candidate_id": 1,
      "name": "John Doe",
      "ai_score": 95.3,
      "recommendation": "Excellent match - Highly recommended for interview"
    },
    {
      "candidate_id": 2,
      "name": "Jane Smith",
      "ai_score": 88.7,
      "recommendation": "Excellent match - Highly recommended for interview"
    }
  ]
}
```

**Features:**
- ✅ Real-time processing statistics
- ✅ Score aggregates (avg, min, max)
- ✅ Sorted by score (highest first)
- ✅ All candidates with recommendations

---

## How Automatic Processing Works

### Single Resume Submission Flow
```
1. HR uploads resume via batch/process endpoint
   ↓
2. Resume saved to disk
   ↓
3. Text extracted from resume
   ↓
4. Skills, experience, education extracted (NLP)
   ↓
5. Skills matched against job requirements
   ↓
6. AI score calculated (0-100)
   ↓
7. Results stored in database
   ↓
8. Candidate and ResumeParsing updated
   ↓
9. Response returned with full analysis
```

### Multiple Resumes Batch Processing Flow
```
1. HR uploads multiple resumes via batch/upload endpoint
   ↓
2. API returns immediately with "processing" status
   ↓
3. Background task processes each resume:
   a) Save file
   b) Extract text
   c) Extract fields
   d) Match skills
   e) Calculate score
   f) Store in DB
   ↓
4. Progress can be monitored via processing-status endpoint
   ↓
5. All resumes processed and available for review
```

---

## Features

### Automatic Processing
✅ **Immediate extraction** - Text extracted as soon as resume is uploaded
✅ **Automatic field extraction** - Skills, experience, education extracted automatically
✅ **Skill matching** - Skills automatically matched against job requirements
✅ **AI scoring** - Score calculated automatically
✅ **Database storage** - All results stored automatically

### Multiple Candidate Handling
✅ **Batch processing** - Handle 10, 100, or 1000 resumes efficiently
✅ **Background execution** - Doesn't block API or web browser
✅ **Concurrent processing** - Multiple jobs can be processed simultaneously
✅ **Auto candidate creation** - Creates candidate records automatically
✅ **Error resilience** - Skips failed resumes, continues with others

### Status Monitoring
✅ **Processing status** - Check progress in real-time
✅ **Score statistics** - See aggregated insights
✅ **Individual results** - View each candidate's score and recommendation
✅ **Sorted results** - Automatically sorted by score

---

## Usage Scenarios

### Scenario 1: Single Resume Upload (Immediate Response)
User uploads their resume for a job posting.

```python
# Client code
async with aiohttp.ClientSession() as session:
    with open('resume.pdf', 'rb') as f:
        data = aiohttp.FormData()
        data.add_field('file', f, filename='resume.pdf')
        data.add_field('job_id', '5')
        
        async with session.post(
            'http://localhost:8000/api/analyzer/batch/process',
            data=data
        ) as resp:
            result = await resp.json()
            print(f"Your score: {result['ai_score']}")
            print(f"Recommendation: {result['recommendation']}")
```

### Scenario 2: HR Bulk Upload (Background Processing)
HR uploads 50 resumes for a job posting.

```python
# Client code
async with aiohttp.ClientSession() as session:
    data = aiohttp.FormData()
    
    # Add multiple files
    for i, resume_file in enumerate(resume_files):
        data.add_field('files', open(resume_file, 'rb'), filename=resume_file)
    
    data.add_field('job_id', '5')
    
    async with session.post(
        'http://localhost:8000/api/analyzer/batch/upload',
        data=data
    ) as resp:
        result = await resp.json()
        # Returns immediately
        print(f"Processing {result['total_files']} resumes...")
```

Then check progress:

```python
async with aiohttp.ClientSession() as session:
    async with session.get(
        'http://localhost:8000/api/analyzer/job/5/processing-status'
    ) as resp:
        status = await resp.json()
        print(f"Progress: {status['processing_rate']}")
        print(f"Average score: {status['score_stats']['average']}")
```

### Scenario 3: Automated Integration
Resume processing triggered automatically when candidates apply.

```python
# In your candidate application handler
@app.post("/apply")
async def submit_application(
    candidate_data: CandidateForm,
    resume: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    # Create candidate in DB
    candidate = create_candidate(candidate_data)
    
    # Automatically process resume in background
    background_tasks.add_task(
        process_resume_for_job,
        file=resume,
        job_id=candidate_data.job_id,
        candidate_id=candidate.id
    )
    
    # Return immediately to candidate
    return {
        "status": "Application submitted",
        "message": "Your resume is being analyzed"
    }
```

---

## Database Updates

### Automatic Fields Updated
When a resume is processed, the system automatically updates:

**Candidate Table:**
- `resume_url` - Path to saved resume file
- `skills` - Extracted and matched skills
- `experience` - Extracted years of experience
- `education` - Extracted education qualifications
- `ai_score` - Calculated AI match score

**ResumeParsing Table:**
- `skills_extracted` - All extracted skills (before matching)
- `experience_extracted` - Extracted experience
- `education_extracted` - Extracted education
- `ai_score` - AI match score

---

## Error Handling

### Batch Processing Resilience
If one resume fails, the batch continues:

```json
{
  "status": "completed",
  "total_files": 50,
  "successfully_processed": 48,
  "failed": 2,
  "failed_files": [
    "invalid_format.docx",
    "corrupted.pdf"
  ]
}
```

### Individual Resume Errors
- Invalid file format → Skipped with error log
- Empty resume → Error returned, processing continues
- Missing job → HTTPException raised
- Database error → Rolled back, error logged

---

## Performance Optimization

### Batch Processing Strategy
1. **Asynchronous** - Background tasks don't block API
2. **Efficient database commits** - Single batch insert
3. **Memory managed** - NLP text limited to 1MB
4. **Graceful degradation** - Failed resumes don't stop batch

### Recommended Limits
- **Single resume**: Immediate processing (<5 seconds typically)
- **Batch upload**: 1-100 resumes (background task)
- **Concurrent jobs**: Multiple jobs can be processed simultaneously

---

## API Summary

| Endpoint | Method | Purpose | Response Time |
|----------|--------|---------|---|
| `/batch/upload` | POST | Upload multiple resumes | Immediate (background) |
| `/batch/process` | POST | Process single resume | 2-10 seconds |
| `/job/{job_id}/processing-status` | GET | Check batch progress | <1 second |
| `/analyze` | POST | Manual analysis | 2-10 seconds |
| `/job/{job_id}/generate-scores` | POST | Bulk score generation | Background |

---

## Configuration

### Adjust Background Task Settings
In your FastAPI app configuration:

```python
# settings.py
BATCH_PROCESSING_ENABLED = True
MAX_BATCH_SIZE = 100  # Max resumes per batch
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
RESUME_UPLOAD_DIR = "app/static/resumes"
```

### NLP Text Limits
In extractor_nlp.py:

```python
# Process first 1 million characters
doc = nlp(text[:1000000])
```

---

## Future Enhancements

1. **Email Notifications** - Notify candidates when resume is processed
2. **Webhook Callbacks** - POST results to external systems
3. **Database Optimization** - Index on job_id, ai_score for faster queries
4. **Caching** - Cache embeddings to reduce recomputation
5. **Rate Limiting** - Limit uploads per user/job
6. **Progress Streaming** - WebSocket for real-time batch progress
7. **Detailed Logging** - Track processing duration per resume
8. **CSV Export** - Download all results as CSV

---

## Testing

### Test Single Resume Processing
```bash
curl -X POST http://localhost:8000/api/analyzer/batch/process \
  -F "file=@test_resume.pdf" \
  -F "job_id=1"
```

### Test Batch Upload
```bash
curl -X POST http://localhost:8000/api/analyzer/batch/upload \
  -F "files=@resume1.pdf" \
  -F "files=@resume2.pdf" \
  -F "job_id=1"
```

### Test Status Check
```bash
curl http://localhost:8000/api/analyzer/job/1/processing-status
```

---

## Troubleshooting

### Issue: Batch processing too slow
- **Solution**: Increase background task workers, or process in smaller batches

### Issue: Out of memory errors
- **Solution**: Reduce resume text limit in NLP processing (1000000 → 500000)

### Issue: Files not saved
- **Solution**: Check directory permissions for `app/static/resumes/`

### Issue: NLP model not loaded
- **Solution**: Install spaCy model: `python -m spacy download en_core_web_sm`

