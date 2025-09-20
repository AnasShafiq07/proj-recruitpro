from sqlalchemy.orm import Session
from app.db import models
from app.schemas.job import JobCreate, JobUpdate, JobUpdateWithFormUpdate, JobCreateWithFormCreate
from app.schemas.questions_form import QuestionsFormCreate
from app.schemas.question import QuestionCreate


def create_job(db: Session, job_data: JobCreateWithFormCreate):
    # create job
    db_job: models.Job = models.Job(
        hr_id = job_data.hr_id,
        title = job_data.title,
        description = job_data.description,
        requirements = job_data.requirements,
        location = job_data.location,
        salary_range = job_data.salary_range, 
        deadline = job_data.deadline,
        application_fee = job_data.application_fee
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)

    if job_data.questions_form:
        db_form = models.QuestionsForm(job_id=db_job.job_id)
        db.add(db_form)
        db.commit()
        db.refresh(db_form)

        for q in job_data.questions_form.questions:
            db_question = models.Question(form_id=db_form.form_id,**q.model_dump())
            db.add(db_question)

        db.commit()
        db.refresh(db_form)

        db_job.question_forms = db_form

    return db_job



def get_job(db: Session, job_id: int):
    return db.query(models.Job).filter(models.Job.job_id == job_id).first()


def get_job_questions(db: Session, job_id: int):
    return db.query(models.Question).join(models.QuestionsForm).filter(models.QuestionsForm.job_id == job_id).all()

def get_jobs(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Job).offset(skip).limit(limit).all()

def get_job_by_slug(db: Session, slug: str):
    return db.query(models.Job).filter(models.Job.slug == slug).first()

def update_job(db: Session, job_id: int, job_data: JobUpdateWithFormUpdate):
    db_job = get_job(db, job_id)
    if not db_job:
        return None

    for field, value in job_data.model_dump(exclude_unset=True, exclude={"questions_form"}).items():
        setattr(db_job, field, value)

    if job_data.questions_form:
        if db_job.questions_form:
            db_form = db_job.questions_form

            db.query(models.Question).filter(models.Question.form_id == db_form.form_id).delete()

            for q in job_data.questions_form.questions:
                db_question = models.Question(form_id=db_form.form_id, **q.model_dump())
                db.add(db_question)

            db.commit()
            db.refresh(db_form)
        else:
            db_form = models.QuestionsForm(job_id=db_job.job_id)
            db.add(db_form)
            db.commit()
            db.refresh(db_form)

            for q in job_data.questions_form.questions:
                db_question = models.Question(form_id=db_form.form_id, **q.model_dump())
                db.add(db_question)

            db.commit()
            db.refresh(db_form)

            db_job.questions_form = db_form

    db.commit()
    db.refresh(db_job)
    return db_job

def get_questions_form_by_job(db: Session, job_id: int):
    return db.query(models.QuestionsForm).filter(models.QuestionsForm.job_id == job_id).first()


def delete_job(db: Session, job_id: int):
    db_job = get_job(db, job_id)
    if not db_job:
        return None

    # delete related questions (list of rows)
    db_questions = get_job_questions(db, db_job.job_id)
    if db_questions:
        for question in db_questions:
            db.delete(question)

    # delete related form (single row)
    db_form = get_questions_form_by_job(db, db_job.job_id)
    if db_form:
        db.delete(db_form)

    # finally delete job
    db.delete(db_job)
    db.commit()

    return db_job


