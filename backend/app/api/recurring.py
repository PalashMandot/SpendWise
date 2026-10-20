from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.user import User
from app.models.recurring import RecurringTransaction
from app.models.category import Category
from app.schemas.recurring import (
    RecurringCreate,
    RecurringUpdate,
    RecurringOut,
    RecurringProcessResult
)
from app.schemas.transaction import TransactionOut
from app.services.recurring_service import process_due_recurring_transactions
from app.api.deps import get_current_user

router = APIRouter(prefix="/recurring", tags=["Recurring Transactions"])


@router.get("", response_model=List[RecurringOut])
def list_recurring_rules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """List all scheduled recurring transaction rules for current user."""
    rules = db.query(RecurringTransaction).filter(
        RecurringTransaction.user_id == current_user.id
    ).order_by(RecurringTransaction.next_due_date.asc()).all()
    return rules


@router.post("", response_model=RecurringOut, status_code=status.HTTP_201_CREATED)
def create_recurring_rule(
    rule_in: RecurringCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Create a recurring transaction schedule (e.g. monthly rent, weekly groceries, salary)."""
    # Verify category
    cat = db.query(Category).filter(
        Category.id == rule_in.category_id,
        or_(Category.user_id == current_user.id, Category.is_system == True)
    ).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category ID")

    rule = RecurringTransaction(
        user_id=current_user.id,
        category_id=rule_in.category_id,
        amount=round(rule_in.amount, 2),
        type=rule_in.type,
        description=rule_in.description.strip(),
        frequency=rule_in.frequency,
        start_date=rule_in.start_date,
        end_date=rule_in.end_date,
        next_due_date=rule_in.start_date,
        payment_method=rule_in.payment_method,
        notes=rule_in.notes,
        is_active=rule_in.is_active
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.put("/{rule_id}", response_model=RecurringOut)
def update_recurring_rule(
    rule_id: int,
    rule_update: RecurringUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Update recurring schedule parameters."""
    rule = db.query(RecurringTransaction).filter(
        RecurringTransaction.id == rule_id,
        RecurringTransaction.user_id == current_user.id
    ).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring rule not found")

    if rule_update.category_id is not None:
        cat = db.query(Category).filter(
            Category.id == rule_update.category_id,
            or_(Category.user_id == current_user.id, Category.is_system == True)
        ).first()
        if not cat:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category ID")
        rule.category_id = rule_update.category_id

    if rule_update.amount is not None:
        rule.amount = round(rule_update.amount, 2)
    if rule_update.type is not None:
        rule.type = rule_update.type
    if rule_update.description is not None:
        rule.description = rule_update.description.strip()
    if rule_update.frequency is not None:
        rule.frequency = rule_update.frequency
    if rule_update.start_date is not None:
        rule.start_date = rule_update.start_date
    if rule_update.end_date is not None:
        rule.end_date = rule_update.end_date
    if rule_update.next_due_date is not None:
        rule.next_due_date = rule_update.next_due_date
    if rule_update.payment_method is not None:
        rule.payment_method = rule_update.payment_method
    if rule_update.notes is not None:
        rule.notes = rule_update.notes
    if rule_update.is_active is not None:
        rule.is_active = rule_update.is_active

    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}", status_code=status.HTTP_200_OK)
def delete_recurring_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Delete a recurring rule."""
    rule = db.query(RecurringTransaction).filter(
        RecurringTransaction.id == rule_id,
        RecurringTransaction.user_id == current_user.id
    ).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring rule not found")

    db.delete(rule)
    db.commit()
    return {"message": "Recurring rule deleted successfully"}


@router.post("/process-due", response_model=RecurringProcessResult)
def process_due_rules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Trigger processing of all due recurring rules into real transactions."""
    count, txns = process_due_recurring_transactions(db, current_user.id)
    return RecurringProcessResult(
        processed_count=count,
        generated_transactions=[TransactionOut.model_validate(t) for t in txns]
    )
