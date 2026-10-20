from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), default="expense", nullable=False)  # "expense", "income", "both"
    color = Column(String(20), default="#64748B", nullable=False)
    icon = Column(String(50), default="tag", nullable=False)
    is_system = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="category", cascade="all, delete-orphan")
    recurring_rules = relationship("RecurringTransaction", back_populates="category", cascade="all, delete-orphan")
