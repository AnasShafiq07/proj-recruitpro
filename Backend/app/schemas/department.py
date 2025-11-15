from pydantic import BaseModel


class DepartmentBase(BaseModel):
    department_name: str


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    department_name: str | None = None


class DepartmentOut(DepartmentBase):
    department_id: int

    class Config:
        from_attributes = True
