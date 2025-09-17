from sqlalchemy.orm import Session
from app.db.models import Company
from app.schemas.company import CompanyCreate, CompanyUpdate
from app.utilities.password import hash_password




def create_company(db: Session, company_in: CompanyCreate) -> Company:
    db_company = Company(
        name=company_in.name
    )
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company


def get_company(db: Session, company_id: int) -> Company | None:
    return db.query(Company).filter(Company.company_id == company_id).first()


def get_company_by_email(db: Session, email: str) -> Company | None:
    return db.query(Company).filter(Company.email == email).first()


def update_company(db: Session, company_id: int, company_in: CompanyUpdate) -> Company | None:
    db_company = get_company(db, company_id)
    if not db_company:
        return None

    for field, value in company_in.model_dump(exclude_unset=True).items():
        if field == "password" and value:
            value = hash_password(value)
        setattr(db_company, field, value)

    db.commit()
    db.refresh(db_company)
    return db_company


def delete_company(db: Session, company_id: int) -> bool:
    db_company = get_company(db, company_id)
    if not db_company:
        return False
    db.delete(db_company)
    db.commit()
    return True
