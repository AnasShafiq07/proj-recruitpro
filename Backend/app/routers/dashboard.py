from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import asc
from app.db.session import get_db
from app.db.models import HRManager, Interview, Job
from app.core.security import get_current_hr

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/next-interview")
def get_earliest_upcoming_interview(
    db: Session = Depends(get_db),
    hr: HRManager = Depends(get_current_hr),
):
    # 1. Use UTC Now but remove TZ info if your DB stores naive datetimes
    # This is the most common fix for 'None' results
    now = datetime.now(timezone.utc).replace(tzinfo=None)

# Update the query to use options(joinedload(...))
    next_interview = (
    db.query(Interview)
    .join(Job, Interview.job_id == Job.job_id)
    .options(
        joinedload(Interview.candidate),
        joinedload(Interview.job)
    )
    .filter(
        Job.hr_id == hr.id,
        Interview.status == "Scheduled",
        Interview.scheduled_time >= now,
    )
    .order_by(asc(Interview.scheduled_time))
    .first())
    if not next_interview:
        return {"message": "No upcoming interviews found", "data": None}
    print("time",next_interview.scheduled_time)
    return {
        "message": "Upcoming interview found",
        "data": {
            "id": next_interview.interview_id,
            "candidate_name": next_interview.candidate.name,
            "job_title": next_interview.job.title,
            "scheduled_time": next_interview.scheduled_time.isoformat(),
            "meet_link": next_interview.meet_link,
            "status": next_interview.status,
        },
    }