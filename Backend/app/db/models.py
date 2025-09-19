# models.py
from datetime import datetime, timezone
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Text, DateTime, Float, Boolean, ForeignKey
from typing import Optional
from app.database import Base

#good code structure reference:
class Company(Base):
    __tablename__ = "company"

    company_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False, unique=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now(timezone.utc))

    hrs: Mapped[list["HRManager"]] = relationship(back_populates="company")


class HRManager(Base):
    __tablename__ = "hr_manager"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("company.company_id"))
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)
    # roles: OWNER, ADMIN, HR
    role: Mapped[str] = mapped_column(String, default="HR")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now(timezone.utc))
    company: Mapped["Company"] = relationship(back_populates="hrs")
    jobs: Mapped[list["Job"]] = relationship(back_populates="hr_manager")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="hr_manager")
    tokens: Mapped[list["AuthToken"]] = relationship(back_populates="hr_manager")


class Job(Base):
    __tablename__ = "job"

    job_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    hr_id: Mapped[int] = mapped_column(ForeignKey("hr_manager.id"))
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    requirements: Mapped[str] = mapped_column(Text, nullable=True)
    location: Mapped[str] = mapped_column(String, nullable=True)
    salary_range: Mapped[str] = mapped_column(String, nullable=True)
    deadline: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    application_fee: Mapped[float] = mapped_column(Float, nullable=True)

    hr_manager: Mapped["HRManager"] = relationship(back_populates="jobs")
    applications: Mapped[list["Application"]] = relationship(back_populates="job")


class Candidate(Base):
    __tablename__ = "candidate"

    candidate_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=True)
    location: Mapped[str] = mapped_column(String, nullable=True)
    skills: Mapped[str] = mapped_column(Text, nullable=True)
    experience: Mapped[str] = mapped_column(Text, nullable=True)
    education: Mapped[str] = mapped_column(Text, nullable=True)

    applications: Mapped[list["Application"]] = relationship(back_populates="candidate")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="candidate")


class Application(Base):
    __tablename__ = "application"

    application_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("job.job_id"))
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidate.candidate_id"))
    resume_file: Mapped[str] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="Applied")
    submission_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.now(timezone.utc))
    fee_status: Mapped[str] = mapped_column(String, nullable=True)

    job: Mapped["Job"] = relationship(back_populates="applications")
    candidate: Mapped["Candidate"] = relationship(back_populates="applications")
    resume_parsing: Mapped["ResumeParsing"] = relationship(back_populates="application", uselist=False)
    interviews: Mapped[list["Interview"]] = relationship(back_populates="application")
    offer_letters: Mapped[list["OfferLetter"]] = relationship(back_populates="application")
    payment: Mapped["Payment"] = relationship(back_populates="application", uselist=False)
    feedbacks: Mapped[list["Feedback"]] = relationship(back_populates="application")


class ResumeParsing(Base):
    __tablename__ = "resume_parsing"

    parsing_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("application.application_id"))
    skills_extracted: Mapped[str] = mapped_column(Text, nullable=True)
    experience_extracted: Mapped[str] = mapped_column(Text, nullable=True)
    education_extracted: Mapped[str] = mapped_column(Text, nullable=True)
    ai_score: Mapped[float] = mapped_column(Float, nullable=True)

    application: Mapped["Application"] = relationship(back_populates="resume_parsing")


class Interview(Base):
    __tablename__ = "interview"

    interview_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("application.application_id"))
    scheduled_time: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    meet_link: Mapped[str] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=True)

    application: Mapped["Application"] = relationship(back_populates="interviews")


class OfferLetter(Base):
    __tablename__ = "offer_letter"

    offer_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("application.application_id"))
    version_no: Mapped[int] = mapped_column(Integer, default=1)
    details: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now(timezone.utc))

    application: Mapped["Application"] = relationship(back_populates="offer_letters")


class Payment(Base):
    __tablename__ = "payment"

    payment_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("application.application_id"))
    amount: Mapped[float] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String, default="Pending")
    payment_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.now(timezone.utc))

    application: Mapped["Application"] = relationship(back_populates="payment")


class Feedback(Base):
    __tablename__ = "feedback"

    feedback_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("application.application_id"))
    comments: Mapped[str] = mapped_column(Text, nullable=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now(timezone.utc))

    application: Mapped["Application"] = relationship(back_populates="feedbacks")


class Notification(Base):
    __tablename__ = "notification"

    notification_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    message: Mapped[str] = mapped_column(Text, nullable=True)
    type: Mapped[str] = mapped_column(String, nullable=True)

    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidate.candidate_id"), nullable=True)
    hr_id: Mapped[int] = mapped_column(ForeignKey("hr_manager.id"), nullable=True)

    candidate: Mapped["Candidate"] = relationship(back_populates="notifications")
    hr_manager: Mapped["HRManager"] = relationship(back_populates="notifications")


class AuthToken(Base):
    __tablename__ = "auth_tokens"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    access_token: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    refresh_token: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now(timezone.utc))
    # either linked to HR or (rare) to Company if you keep company login
    company_id: Mapped[Optional[int]] = mapped_column(ForeignKey("company.company_id"), nullable=True)
    hr_id: Mapped[Optional[int]] = mapped_column(ForeignKey("hr_manager.id"), nullable=True)

    hr_manager: Mapped["HRManager"] = relationship(back_populates="tokens")


class BlacklistedToken(Base):
    __tablename__ = "blacklisted_tokens"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    token: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    blacklisted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now(timezone.utc))
