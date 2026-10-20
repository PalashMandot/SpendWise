from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.category import CategoryOut


class TransactionBase(BaseModel):
    category_id: int
    amount: float = Field(..., gt=0)
    type: str = Field(..., pattern="^(income|expense)$")
    description: str = Field(..., min_length=1, max_length=255)
    date: date
    payment_method: str = Field(default="credit_card", pattern="^(credit_card|debit_card|cash|bank_transfer|other)$")
    notes: Optional[str] = None
    is_recurring: Optional[bool] = False


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    category_id: Optional[int] = None
    amount: Optional[float] = Field(None, gt=0)
    type: Optional[str] = Field(None, pattern="^(income|expense)$")
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    date: Optional[date] = None
    payment_method: Optional[str] = Field(None, pattern="^(credit_card|debit_card|cash|bank_transfer|other)$")
    notes: Optional[str] = None
    is_recurring: Optional[bool] = None


class TransactionOut(TransactionBase):
    id: int
    user_id: int
    category: Optional[CategoryOut] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TransactionPagination(BaseModel):
    items: List[TransactionOut]
    total: int
    page: int
    size: int
    total_pages: int
