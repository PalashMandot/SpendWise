from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class RecurringTransaction(Base):
    __tablename__ = "recurring_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    type = Column(String(20), default="expense", nullable=False)  # "income" or "expense"
    description = Column(String(255), nullable=False)
    frequency = Column(String(20), default="monthly", nullable=False)  # "daily", "weekly", "monthly", "yearly"
    start_date = Column(Date, default=date.today, nullable=False)
    end_date = Column(Date, nullable=True)
    next_due_date = Column(Date, nullable=False, index=True)
    payment_method = Column(String(50), default="bank_transfer", nullable=False)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="recurring_rules")
    category = relationship("Category", back_populates="recurring_rules")
