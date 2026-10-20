from typing import Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.analytics import DashboardData, InsightsReport
from app.services.analytics_service import (
    get_dashboard_summary,
    calculate_insights_and_projections,
    get_current_month_str
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics & Insights"])


@router.get("/dashboard", response_model=DashboardData)
def get_dashboard(
    month: Optional[str] = Query(None, pattern="^\\d{4}-(0[1-9]|1[0-2])$", description="Target month YYYY-MM"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve full dashboard metrics, cash flow charts, category breakdown, and alerts for month."""
    target_month = month or get_current_month_str()
    return get_dashboard_summary(db, current_user.id, target_month)


@router.get("/insights", response_model=InsightsReport)
def get_insights(
    month: Optional[str] = Query(None, pattern="^\\d{4}-(0[1-9]|1[0-2])$", description="Target month YYYY-MM"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve rule-based statistical insights, burn rate forecast, and AI-generated summary."""
    target_month = month or get_current_month_str()
    return calculate_insights_and_projections(db, current_user.id, target_month)
