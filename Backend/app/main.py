from fastapi import FastAPI
from app.database import Base, engine
from app.routers import analyzer_router, auth_router, candidate_router, company_router, dashboard_router, feedback_router, hr_manager_router, interview_router,  job_router, notification_router, offer_letter_router, payment_router, resume_parsing_router, linkedIn_router


Base.metadata.create_all(bind=engine)

app = FastAPI(title="RecruitPro API")


app.include_router(auth_router)
app.include_router(analyzer_router)
app.include_router(dashboard_router)
app.include_router(linkedIn_router)
app.include_router(candidate_router)
app.include_router(company_router)
app.include_router(hr_manager_router)
app.include_router(job_router)
app.include_router(interview_router)
app.include_router(feedback_router)
app.include_router(notification_router)
app.include_router(resume_parsing_router)
app.include_router(offer_letter_router)
app.include_router(payment_router)

@app.get("/")
def root():
    return {"message": "RecruitPro API is running"}