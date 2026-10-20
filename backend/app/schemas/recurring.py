from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.category import CategoryOut
from app.schemas.transaction import TransactionOut


class RecurringBase(BaseModel):
    category_id: int
    amount: float = Field(..., gt=0)
    type: str = Field(default="expense", pattern="^(income|expense)$")
    description: str = Field(..., min_length=1, max_length=255)
    frequency: str = Field(default="monthly", pattern="^(daily|weekly|monthly|yearly)$")
    start_date: date
    end_date: Optional[date] = None
    payment_method: str = Field(default="bank_transfer", pattern="^(credit_card|debit_card|cash|bank_transfer|other)$")
    notes: Optional[str] = None
    is_active: bool = True


class RecurringCreate(RecurringBase):
    pass


class RecurringUpdate(BaseModel):
    category_id: Optional[int] = None
    amount: Optional[float] = Field(None, gt=0)
    type: Optional[str] = Field(None, pattern="^(income|expense)$")
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    frequency: Optional[str] = Field(None, pattern="^(daily|weekly|monthly|yearly)$")
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    next_due_date: Optional[date] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class RecurringOut(RecurringBase):
    id: int
    user_id: int
    next_due_date: date
    created_at: datetime
    category: Optional[CategoryOut] = None

    class Config:
        from_attributes = True


class RecurringProcessResult(BaseModel):
    processed_count: int
    generated_transactions: List[TransactionOut]
