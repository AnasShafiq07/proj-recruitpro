from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.offer_letter import OfferLetterCreate, OfferLetterUpdate, OfferLetterOut
from app.services.offer_letter import (
    create_offer_letter,
    get_offer_letter,
    get_offer_letters,
    update_offer_letter,
    delete_offer_letter,
)
from app.core.security import get_current_hr

router = APIRouter(prefix="/offer-letters", tags=["Offer Letters"], dependencies=[Depends(get_current_hr)])

@router.post("/", response_model=OfferLetterOut, status_code=status.HTTP_201_CREATED)
def create_offer_letter_endpoint(letter: OfferLetterCreate, db: Session = Depends(get_db)):
    return create_offer_letter(db, letter)

@router.get("/{offer_id}", response_model=OfferLetterOut)
def get_offer_letter_endpoint(offer_id: int, db: Session = Depends(get_db)):
    db_letter = get_offer_letter(db, offer_id)
    if not db_letter:
        raise HTTPException(status_code=404, detail="Offer Letter not found")
    return db_letter

@router.get("/", response_model=List[OfferLetterOut])
def get_all_offer_letters(db: Session = Depends(get_db)):
    return get_offer_letters(db)

@router.put("/{offer_id}", response_model=OfferLetterOut)
def update_offer_letter_endpoint(offer_id: int, letter: OfferLetterUpdate, db: Session = Depends(get_db)):
    db_letter = update_offer_letter(db, offer_id, letter)
    if not db_letter:
        raise HTTPException(status_code=404, detail="Offer Letter not found")
    return db_letter

@router.delete("/{offer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_offer_letter_endpoint(offer_id: int, db: Session = Depends(get_db)):
    deleted = delete_offer_letter(db, offer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Offer Letter not found")
    return None
