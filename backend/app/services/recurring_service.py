from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from typing import List, Tuple
from sqlalchemy.orm import Session

from app.models.recurring import RecurringTransaction
from app.models.transaction import Transaction


def compute_next_date(current_date: date, frequency: str) -> date:
    """Calculate the next due date based on recurrence frequency."""
    if frequency == "daily":
        return current_date + timedelta(days=1)
    elif frequency == "weekly":
        return current_date + timedelta(weeks=1)
    elif frequency == "monthly":
        return current_date + relativedelta(months=1)
    elif frequency == "yearly":
        return current_date + relativedelta(years=1)
    return current_date + relativedelta(months=1)


def process_due_recurring_transactions(db: Session, user_id: int) -> Tuple[int, List[Transaction]]:
    """
    Finds recurring rules due on or before today for the user,
    creates matching transaction entries, advances next_due_date,
    and deactivates rules that exceeded end_date.
    """
    today = date.today()
    due_rules = db.query(RecurringTransaction).filter(
        RecurringTransaction.user_id == user_id,
        RecurringTransaction.is_active == True,
        RecurringTransaction.next_due_date <= today
    ).all()

    generated_transactions: List[Transaction] = []

    for rule in due_rules:
        # Generate transaction
        txn = Transaction(
            user_id=rule.user_id,
            category_id=rule.category_id,
            amount=rule.amount,
            type=rule.type,
            description=f"{rule.description} (Recurring)",
            date=rule.next_due_date,
            payment_method=rule.payment_method,
            notes=f"Auto-generated from recurring schedule #{rule.id}",
            is_recurring=True
        )
        db.add(txn)
        generated_transactions.append(txn)

        # Compute next date
        next_date = compute_next_date(rule.next_due_date, rule.frequency)
        if rule.end_date and next_date > rule.end_date:
            rule.is_active = False
        else:
            rule.next_due_date = next_date

    db.commit()
    for txn in generated_transactions:
        db.refresh(txn)

    return len(generated_transactions), generated_transactions
