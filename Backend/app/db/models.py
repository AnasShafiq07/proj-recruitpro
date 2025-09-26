# models.py
from datetime import datetime, timezone
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Text, DateTime, Float, Boolean, ForeignKey
from typing import Optional
from app.database import Base
import uuid

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
    linkedin_tokens: Mapped[list["LinkedInToken"]] = relationship(back_populates="hr_manager")


class LinkedInToken(Base):
    __tablename__ = "linkedin_token"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    hr_id: Mapped[int] = mapped_column(ForeignKey("hr_manager.id"), nullable=False)

    user_id: Mapped[str] = mapped_column(String, index=True)   
    urn: Mapped[str] = mapped_column(String, nullable=False)   # urn:li:person:xxx or urn:li:organization:xxx
    access_token: Mapped[str] = mapped_column(String, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    refresh_token: Mapped[str] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now(timezone.utc))

    # Relationships
    hr_manager: Mapped["HRManager"] = relationship(back_populates="linkedin_tokens")


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
    slug: Mapped[str] = mapped_column(String, unique=True, default=lambda: str(uuid.uuid4()))

    hr_manager: Mapped["HRManager"] = relationship(back_populates="jobs")
    question_form: Mapped["QuestionsForm"] = relationship(back_populates="job")



class QuestionsForm(Base):
    __tablename__ = "questions_form"

    form_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("job.job_id", ondelete="CASCADE"))
    
    job: Mapped["Job"] = relationship(back_populates="question_form")
    questions: Mapped[list["Question"]] = relationship(back_populates="form", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "question"

    question_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    form_id: Mapped[int] = mapped_column(ForeignKey("questions_form.form_id", ondelete="CASCADE"))
    question_text: Mapped[str] = mapped_column(Text, nullable=False)

    form: Mapped["QuestionsForm"] = relationship(back_populates="questions")
    answers: Mapped[list["Answer"]] = relationship(back_populates="question", cascade="all, delete-orphan")


class Candidate(Base):
    __tablename__ = "candidate"

    candidate_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("job.job_id"))
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=False, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=True)
    location: Mapped[str] = mapped_column(String, nullable=True)
    skills: Mapped[str] = mapped_column(Text, nullable=True)
    experience: Mapped[str] = mapped_column(Text, nullable=True)
    education: Mapped[str] = mapped_column(Text, nullable=True)
    resume_url: Mapped[str] = mapped_column(String)

    
    notifications: Mapped[list["Notification"]] = relationship(back_populates="candidate")
    answers: Mapped[list["Answer"]] = relationship(back_populates="candidate", cascade="all, delete-orphan")


class Answer(Base):
    __tablename__ = "answer"

    answer_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("question.question_id", ondelete="CASCADE"))
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidate.candidate_id", ondelete="CASCADE"))
    answer_text: Mapped[str] = mapped_column(Text, nullable=False)

    question: Mapped["Question"] = relationship(back_populates="answers")
    candidate: Mapped["Candidate"] = relationship(back_populates="answers")


class ResumeParsing(Base):
    __tablename__ = "resume_parsing"

    parsing_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    skills_extracted: Mapped[str] = mapped_column(Text, nullable=True)
    experience_extracted: Mapped[str] = mapped_column(Text, nullable=True)
    education_extracted: Mapped[str] = mapped_column(Text, nullable=True)
    ai_score: Mapped[float] = mapped_column(Float, nullable=True)


class Interview(Base):
    __tablename__ = "interview"

    interview_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    scheduled_time: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    meet_link: Mapped[str] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=True)


class OfferLetter(Base):
    __tablename__ = "offer_letter"

    offer_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    version_no: Mapped[int] = mapped_column(Integer, default=1)
    details: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now(timezone.utc))



class Payment(Base):
    __tablename__ = "payment"

    payment_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidate.candidate_id"))
    job_id: Mapped[int] = mapped_column(ForeignKey("job.job_id"))
    amount: Mapped[float] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String, default="Pending")
    payment_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.now(timezone.utc))



class Feedback(Base):
    __tablename__ = "feedback"

    feedback_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    comments: Mapped[str] = mapped_column(Text, nullable=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now(timezone.utc))



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
