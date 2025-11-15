from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.core.security import get_current_hr

from app.schemas.department import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentOut,
)

from app.services.department import (
    create_department,
    get_department,
    get_departments,
    update_department,
    delete_department,
)

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.post(
    "/", 
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_current_hr)]
)
def create_department_endpoint(
    department: DepartmentCreate,
    db: Session = Depends(get_db)
):
    return create_department(db, department)


@router.get(
    "/{department_id}",
    dependencies=[Depends(get_current_hr)]
)
def get_department_endpoint(
    department_id: int,
    db: Session = Depends(get_db)
):
    db_department = get_department(db, department_id)
    if not db_department:
        raise HTTPException(status_code=404, detail="Department not found")
    return db_department


@router.get(
    "/", 
    dependencies=[Depends(get_current_hr)]
)
def get_all_departments_endpoint(
    db: Session = Depends(get_db)
):
    return get_departments(db)


@router.put(
    "/{department_id}",
    dependencies=[Depends(get_current_hr)]
)
def update_department_endpoint(
    department_id: int,
    department: DepartmentUpdate,
    db: Session = Depends(get_db)
):
    db_department = update_department(db, department_id, department)
    if not db_department:
        raise HTTPException(status_code=404, detail="Department not found")
    return db_department


@router.delete(
    "/{department_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(get_current_hr)]
)
def delete_department_endpoint(
    department_id: int,
    db: Session = Depends(get_db)
):
    deleted = delete_department(db, department_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Department not found")
    return None
