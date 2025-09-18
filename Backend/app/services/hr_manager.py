from sqlalchemy.orm import Session
from app.db.models import HRManager
from app.schemas.hr_manager import HRManagerCreate, HRManagerUpdate
from app.utilities.password import hash_password



def create_hr_manager(db: Session, hr_in: HRManagerCreate) -> HRManager:
    db_hr = HRManager(
        name=hr_in.name,
        email=hr_in.email,
        password=hr_in.password,
        role=hr_in.role,
        company_id=hr_in.company_id,
    )
    db.add(db_hr)
    db.commit()
    db.refresh(db_hr)
    return db_hr


def get_hr_manager(db: Session, hr_id: int) -> HRManager | None:
    return db.query(HRManager).filter(HRManager.id == hr_id).first()

def get_hr_managers(db: Session):
    return db.query(HRManager).all()

def get_hr_by_email(db: Session, email: str) -> HRManager | None:
    return db.query(HRManager).filter(HRManager.email == email).first()


def update_hr_manager(db: Session, hr_id: int, hr_in: HRManagerUpdate) -> HRManager | None:
    db_hr = get_hr_manager(db, hr_id)
    if not db_hr:
        return None

    for field, value in hr_in.model_dump(exclude_unset=True).items():
        if field == "password" and value:
            value = hash_password(value)
        setattr(db_hr, field, value)

    db.commit()
    db.refresh(db_hr)
    return db_hr


def delete_hr_manager(db: Session, hr_id: int) -> bool:
    db_hr = get_hr_manager(db, hr_id)
    if not db_hr:
        return False
    db.delete(db_hr)
    db.commit()
    return True