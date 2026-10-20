from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.category import CategoryOut


class BudgetBase(BaseModel):
    category_id: Optional[int] = None  # None = Overall monthly budget
    month: str = Field(..., pattern="^\\d{4}-(0[1-9]|1[0-2])$")  # "YYYY-MM"
    amount: float = Field(..., gt=0)
    alert_threshold: float = Field(default=0.8, ge=0.1, le=1.0)


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    alert_threshold: Optional[float] = Field(None, ge=0.1, le=1.0)


class BudgetOut(BudgetBase):
    id: int
    user_id: int
    category: Optional[CategoryOut] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BudgetStatus(BudgetOut):
    spent: float
    remaining: float
    percentage: float
    status: str  # "normal", "warning", "exceeded"
