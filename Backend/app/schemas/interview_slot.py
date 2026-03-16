from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import List, Optional

class GenerateSlotsRequest(BaseModel):
    availability_id: int

class AvailableSlotResponse(BaseModel):
    id: int
    date: datetime
    start_time: str
    end_time: str

    class Config:
        from_attributes = True

class BookSlotRequest(BaseModel):
    candidate_id: int
    email: EmailStr


class BulkInvitePayload(BaseModel):
    """
    Schema for HR to send interview invitations to multiple candidates.
    """
    candidate_ids: List[int] = Field(..., description="List of candidate IDs to receive invitations")
    job_id: int = Field(..., description="The ID of the job for which the interview is being scheduled")
    subject: str = Field(
        default="Invitation to Schedule Your Interview", 
        description="The subject line of the invitation email"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "candidate_ids": [1, 5, 12],
                "job_id": 1,
                "subject": "Next Steps: Interview Invitation for Software Engineer"
            }
        }