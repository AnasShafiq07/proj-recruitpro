from .auth import router as auth_router
from .analyzer import router as analyzer_router
from .dashboard import router as dashboard_router
from .application import router as application_router
from .candidate import router as candidate_router
from .company import router as company_router
from .feedback import router as feedback_router
from .hr_manager import router as hr_manager_router
from .interview import router as interview_router
from .job import router as job_router
from .notification import router as notification_router
from .offer_letter import router as offer_letter_router
from .payment import router as payment_router
from .resume_parsing import router as resume_parsing_router

__all__ = ["auth_router", "analyzer_router", "dashboard_router", "application_router", "candidate_router", "company_router", "feedback_router", "hr_manager_router", "interview_router", "job_router", "notification_router", "offer_letter_router", "payment_router", "resume_parsing_router"]

