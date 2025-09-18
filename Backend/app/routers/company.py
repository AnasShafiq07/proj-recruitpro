# company_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyOut
from app.services.company import (
    create_company,
    get_company,
    get_companies,
    update_company,
    delete_company,
)
from app.core.security import get_current_hr

router = APIRouter(prefix="/companies", tags=["Companies"], dependencies=[Depends(get_current_hr)])

@router.post("/", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
def create_company_endpoint(company: CompanyCreate, db: Session = Depends(get_db)):
    return create_company(db, company)

@router.get("/{company_id}", response_model=CompanyOut)
def get_company_endpoint(company_id: int, db: Session = Depends(get_db)):
    db_company = get_company(db, company_id)
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")
    return db_company

@router.get("/", response_model=List[CompanyOut])
def get_all_companies(db: Session = Depends(get_db)):
    return get_companies(db)

@router.put("/{company_id}", response_model=CompanyOut)
def update_company_endpoint(company_id: int, company: CompanyUpdate, db: Session = Depends(get_db)):
    db_company = update_company(db, company_id, company)
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")
    return db_company

@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company_endpoint(company_id: int, db: Session = Depends(get_db)):
    deleted = delete_company(db, company_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Company not found")
    return None
