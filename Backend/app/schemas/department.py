from pydantic import BaseModel
from typing import Optional


class DepartmentBase(BaseModel):
    department_name: str


class DepartmentCreate(DepartmentBase):
    company_id: Optional[int] = None
    pass


class DepartmentUpdate(BaseModel):
    department_name: str | None = None


class DepartmentOut(DepartmentBase):
    department_id: int

    class Config:
        from_attributes = True
