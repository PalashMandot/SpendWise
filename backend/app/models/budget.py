from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=True, index=True)  # Null = Overall monthly budget
    month = Column(String(7), nullable=False, index=True)  # Format: "YYYY-MM"
    amount = Column(Float, nullable=False)
    alert_threshold = Column(Float, default=0.8, nullable=False)  # 0.8 = 80%
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")

    # A user can only have one budget per category per month (or one overall budget per month)
    __table_args__ = (
        UniqueConstraint('user_id', 'category_id', 'month', name='uq_user_category_month_budget'),
    )
