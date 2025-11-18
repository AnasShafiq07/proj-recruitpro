from sqlalchemy.orm import Session
from app.db import models
from app.schemas.department import DepartmentCreate, DepartmentUpdate


def create_department(db: Session, department_data: DepartmentCreate):
    db_department = models.Department(
        department_name=department_data.department_name,
        company_id = department_data.company_id
    )
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return db_department


def get_department(db: Session, department_id: int):
    return db.query(models.Department).filter(
        models.Department.department_id == department_id
    ).first()


def get_department(db: Session, dept_id: int):
    return db.query(models.Department).filter(models.Department.department_id == dept_id).first()

def get_departments(db: Session, company_id: int):
    return db.query(models.Department).filter(models.Department.company_id == company_id).all()

def update_department(db: Session, department_id: int, department_data: DepartmentUpdate):
    db_department = get_department(db, department_id)
    if not db_department:
        return None

    update_data = department_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_department, field, value)

    db.commit()
    db.refresh(db_department)
    return db_department


def delete_department(db: Session, department_id: int):
    db_department = get_department(db, department_id)
    if not db_department:
        return None
    db.delete(db_department)
    db.commit()

    return db_department
