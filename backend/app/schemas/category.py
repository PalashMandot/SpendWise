from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(default="expense", pattern="^(expense|income|both)$")
    color: str = Field(default="#10B981", max_length=20)
    icon: str = Field(default="tag", max_length=50)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[str] = Field(None, pattern="^(expense|income|both)$")
    color: Optional[str] = Field(None, max_length=20)
    icon: Optional[str] = Field(None, max_length=50)


class CategoryOut(CategoryBase):
    id: int
    user_id: Optional[int] = None
    is_system: bool
    created_at: datetime

    class Config:
        from_attributes = True
