from sqlalchemy.orm import  Session
from app.db.models import AuthToken, BlacklistedToken
from app.schemas.auth_token import AuthTokenCreate, BlacklistedTokenCreate
from datetime import datetime, timezone
import smtplib
import dns.resolver

def check_email_exists(email):
    domain = email.split('@')[1]

    try:
        # Get MX record
        mx_records = dns.resolver.resolve(domain, 'MX')
        mx_record = str(mx_records[0].exchange)

        # Connect to mail server
        server = smtplib.SMTP(timeout=10)
        server.connect(mx_record)
        server.helo("example.com")
        server.mail("test@example.com")

        code, message = server.rcpt(email)
        server.quit()

        if code == 250:
            return True
        else:
            return False

    except Exception as e:
        return False


def add_access_token(db: Session, token: AuthTokenCreate):
    db_token = AuthToken(
        access_token = token.access_token,
        refresh_token = token.refresh_token,
        expires_at = token.expires_at,
        company_id = token.company_id,
        hr_id = token.hr_id
    )
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token

def create_blacklisted_token(db: Session, token: BlacklistedTokenCreate):
    db_token = BlacklistedToken(**token.model_dump())
    db.add(db_token)
    db.commit()
    db.refresh(db_token)
    return db_token


def is_blacklisted_token(db: Session, token: str)-> bool:
    token = db.query(BlacklistedToken).filter(BlacklistedToken.token == token).first()
    if token is None:
        return False
    return True