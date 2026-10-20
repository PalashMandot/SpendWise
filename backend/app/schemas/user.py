from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    currency: Optional[str] = "USD"


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    currency: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=128)


class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
