from sqlalchemy.orm import Session
from app.db import models
from app.schemas.offer_letter import OfferLetterCreate, OfferLetterUpdate


def create_offer_letter(db: Session, offer: OfferLetterCreate):
    db_offer = models.OfferLetter(**offer.model_dump())
    db.add(db_offer)
    db.commit()
    db.refresh(db_offer)
    return db_offer


def get_offer_letter(db: Session, offer_id: int):
    return db.query(models.OfferLetter).filter(models.OfferLetter.offer_id == offer_id).first()


def get_offer_letters(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.OfferLetter).offset(skip).limit(limit).all()


def update_offer_letter(db: Session, offer_id: int, offer: OfferLetterUpdate):
    db_offer = get_offer_letter(db, offer_id)
    if not db_offer:
        return None
    for field, value in offer.model_dump(exclude_unset=True).items():
        setattr(db_offer, field, value)
    db.commit()
    db.refresh(db_offer)
    return db_offer


def delete_offer_letter(db: Session, offer_id: int):
    db_offer = get_offer_letter(db, offer_id)
    if db_offer:
        db.delete(db_offer)
        db.commit()
    return db_offer
