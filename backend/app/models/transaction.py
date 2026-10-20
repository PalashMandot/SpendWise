from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    type = Column(String(20), nullable=False)  # "income" or "expense"
    description = Column(String(255), nullable=False, index=True)
    date = Column(Date, default=date.today, nullable=False, index=True)
    payment_method = Column(String(50), default="credit_card", nullable=False)
    notes = Column(Text, nullable=True)
    is_recurring = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
