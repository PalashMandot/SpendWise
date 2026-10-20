from typing import Any, List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.database import get_db
from app.models.user import User
from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetOut, BudgetStatus
from app.services.analytics_service import get_month_date_range, get_current_month_str
from app.api.deps import get_current_user

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.get("", response_model=List[BudgetStatus])
def list_budgets_with_status(
    month: Optional[str] = Query(None, pattern="^\\d{4}-(0[1-9]|1[0-2])$", description="Target month YYYY-MM"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve all budgets for a given month with live spending calculations and alerts."""
    target_month = month or get_current_month_str()
    start_date, end_date = get_month_date_range(target_month)

    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == target_month
    ).all()

    results: List[BudgetStatus] = []
    for b in budgets:
        # Calculate spent
        query = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "expense",
            Transaction.date >= start_date,
            Transaction.date <= end_date
        )
        if b.category_id is not None:
            query = query.filter(Transaction.category_id == b.category_id)
        
        cat_spent = query.scalar() or 0.0
        remaining = round(b.amount - cat_spent, 2)
        pct = round((cat_spent / b.amount * 100) if b.amount > 0 else 0.0, 1)

        if pct >= 100.0:
            status_label = "exceeded"
        elif pct >= (b.alert_threshold * 100):
            status_label = "warning"
        else:
            status_label = "normal"

        results.append(BudgetStatus(
            id=b.id,
            user_id=b.user_id,
            category_id=b.category_id,
            month=b.month,
            amount=b.amount,
            alert_threshold=b.alert_threshold,
            created_at=b.created_at,
            updated_at=b.updated_at,
            category=b.category,
            spent=round(cat_spent, 2),
            remaining=remaining,
            percentage=pct,
            status=status_label
        ))

    return results


@router.post("", response_model=BudgetOut, status_code=status.HTTP_201_CREATED)
def create_or_upsert_budget(
    budget_in: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Create a new monthly budget or update an existing one for the same category and month."""
    if budget_in.category_id is not None:
        cat = db.query(Category).filter(
            Category.id == budget_in.category_id,
            or_(Category.user_id == current_user.id, Category.is_system == True)
        ).first()
        if not cat:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category ID")

    # Check for existing budget for this month + category
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category_id == budget_in.category_id,
        Budget.month == budget_in.month
    ).first()

    if existing:
        existing.amount = round(budget_in.amount, 2)
        existing.alert_threshold = budget_in.alert_threshold
        db.commit()
        db.refresh(existing)
        return existing

    budget = Budget(
        user_id=current_user.id,
        category_id=budget_in.category_id,
        month=budget_in.month,
        amount=round(budget_in.amount, 2),
        alert_threshold=budget_in.alert_threshold
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


@router.put("/{budget_id}", response_model=BudgetOut)
def update_budget(
    budget_id: int,
    budget_update: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Update budget amount and alert threshold."""
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    if budget_update.amount is not None:
        budget.amount = round(budget_update.amount, 2)
    if budget_update.alert_threshold is not None:
        budget.alert_threshold = budget_update.alert_threshold

    db.commit()
    db.refresh(budget)
    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_200_OK)
def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Delete a budget with per-user isolation."""
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    if not budget:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    db.delete(budget)
    db.commit()
    return {"message": "Budget deleted successfully"}
