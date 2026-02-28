from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.db.models import DocumentTemplate

def create_document_template(db: Session, hr_id: int, google_doc_id: str):
    template = DocumentTemplate(
        hr_id=hr_id,
        google_doc_id=google_doc_id,
        created_at=datetime.now(timezone.utc)
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


def get_hr_template(db: Session, hr_id: int):
    return db.query(DocumentTemplate).filter_by(hr_id=hr_id).first()


def delete_document_template(db: Session, template_id: int, hr_id: int):
    deleted_count = db.query(DocumentTemplate).filter_by(
        template_id=template_id, 
        hr_id=hr_id
    ).delete(synchronize_session=False)
    
    db.commit()
    return deleted_count > 0

def delete_all_hr_templates(db: Session, hr_id: int):
    deleted_count = db.query(DocumentTemplate).filter_by(hr_id=hr_id).delete(synchronize_session=False)
    db.commit()
    return deleted_count