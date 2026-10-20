from typing import Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.seed_service import seed_user_demo_data, reset_user_data
from app.api.deps import get_current_user

router = APIRouter(prefix="/seed", tags=["Demo Data & Sandbox"])


@router.post("/demo-data", status_code=status.HTTP_201_CREATED)
def seed_demo_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Populate realistic 3-month portfolio demo transactions, budgets, and schedules for current user."""
    count = seed_user_demo_data(db, current_user.id)
    return {
        "message": f"Successfully seeded {count} sample transactions, recurring rules, and active monthly budgets.",
        "transactions_created": count
    }


@router.delete("/reset-data", status_code=status.HTTP_200_OK)
def reset_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Wipe all user transactions, budgets, and custom categories back to a clean empty state."""
    reset_user_data(db, current_user.id)
    return {"message": "All user financial records have been reset to a clean state."}
