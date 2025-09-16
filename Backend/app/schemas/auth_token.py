from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class AuthTokenBase(BaseModel):
    access_token: str
    refresh_token: str
    expires_at: datetime
    company_id: Optional[int] = None
    hr_id: Optional[int] = None


class BlacklistedTokenBase(BaseModel):
    token: str


class AuthTokenCreate(AuthTokenBase):
    pass


class BlacklistedTokenCreate(BlacklistedTokenBase):
    pass

