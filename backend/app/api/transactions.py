from datetime import date
from typing import Any, Optional
import math
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, or_

from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.category import Category
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionOut,
    TransactionPagination
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("", response_model=TransactionPagination)
def list_transactions(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(15, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search description or notes"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    type: Optional[str] = Query(None, pattern="^(income|expense)$", description="Filter by transaction type"),
    start_date: Optional[date] = Query(None, description="Filter from start date"),
    end_date: Optional[date] = Query(None, description="Filter up to end date"),
    sort_by: str = Query("date", pattern="^(date|amount|description|created_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve user transactions with comprehensive filtering, search, sorting, and pagination."""
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    # Filters
    if category_id is not None:
        query = query.filter(Transaction.category_id == category_id)
    if type is not None:
        query = query.filter(Transaction.type == type)
    if start_date is not None:
        query = query.filter(Transaction.date >= start_date)
    if end_date is not None:
        query = query.filter(Transaction.date <= end_date)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Transaction.description.ilike(search_pattern),
                Transaction.notes.ilike(search_pattern)
            )
        )

    # Total count
    total = query.count()

    # Sorting
    sort_column = getattr(Transaction, sort_by)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column), desc(Transaction.id))
    else:
        query = query.order_by(asc(sort_column), asc(Transaction.id))

    # Pagination
    offset = (page - 1) * size
    items = query.offset(offset).limit(size).all()
    total_pages = math.ceil(total / size) if total > 0 else 1

    return TransactionPagination(
        items=[TransactionOut.model_validate(t) for t in items],
        total=total,
        page=page,
        size=size,
        total_pages=total_pages
    )


@router.post("", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(
    txn_in: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Create a new income or expense transaction."""
    # Validate category exists and is accessible
    cat = db.query(Category).filter(
        Category.id == txn_in.category_id,
        or_(Category.user_id == current_user.id, Category.is_system == True)
    ).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or inaccessible category")

    txn = Transaction(
        user_id=current_user.id,
        category_id=txn_in.category_id,
        amount=round(txn_in.amount, 2),
        type=txn_in.type,
        description=txn_in.description.strip(),
        date=txn_in.date,
        payment_method=txn_in.payment_method,
        notes=txn_in.notes,
        is_recurring=txn_in.is_recurring or False
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


@router.get("/{transaction_id}", response_model=TransactionOut)
def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get a specific transaction by ID with strict per-user isolation."""
    txn = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return txn


@router.put("/{transaction_id}", response_model=TransactionOut)
def update_transaction(
    transaction_id: int,
    txn_update: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Update an existing transaction."""
    txn = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    if txn_update.category_id is not None:
        cat = db.query(Category).filter(
            Category.id == txn_update.category_id,
            or_(Category.user_id == current_user.id, Category.is_system == True)
        ).first()
        if not cat:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or inaccessible category")
        txn.category_id = txn_update.category_id

    if txn_update.amount is not None:
        txn.amount = round(txn_update.amount, 2)
    if txn_update.type is not None:
        txn.type = txn_update.type
    if txn_update.description is not None:
        txn.description = txn_update.description.strip()
    if txn_update.date is not None:
        txn.date = txn_update.date
    if txn_update.payment_method is not None:
        txn.payment_method = txn_update.payment_method
    if txn_update.notes is not None:
        txn.notes = txn_update.notes
    if txn_update.is_recurring is not None:
        txn.is_recurring = txn_update.is_recurring

    db.commit()
    db.refresh(txn)
    return txn


@router.delete("/{transaction_id}", status_code=status.HTTP_200_OK)
def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Delete a transaction with strict per-user isolation."""
    txn = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    
    db.delete(txn)
    db.commit()
    return {"message": "Transaction deleted successfully"}
