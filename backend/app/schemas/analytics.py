from typing import List, Optional
from pydantic import BaseModel
from app.schemas.transaction import TransactionOut
from app.schemas.budget import BudgetStatus


class StatCardSummary(BaseModel):
    total_income: float
    total_expense: float
    net_balance: float
    savings_rate: float
    total_budgeted: float
    budget_usage_percent: float


class CategorySpendItem(BaseModel):
    category_id: int
    category_name: str
    color: str
    icon: str
    total: float
    percentage: float


class MonthlyCashFlowItem(BaseModel):
    month: str  # "YYYY-MM" or "Jan 2026"
    income: float
    expense: float
    net: float


class DailySpendItem(BaseModel):
    date: str  # "YYYY-MM-DD"
    amount: float


class DashboardData(BaseModel):
    summary: StatCardSummary
    recent_transactions: List[TransactionOut]
    category_breakdown: List[CategorySpendItem]
    monthly_cash_flow: List[MonthlyCashFlowItem]
    daily_spending: List[DailySpendItem]
    budget_alerts: List[BudgetStatus]


class SpendingInsightItem(BaseModel):
    id: str
    type: str  # "info", "warning", "success", "tip"
    title: str
    description: str
    metric: Optional[str] = None
    impact: Optional[str] = None  # e.g., "+15% vs last month"


class BurnRateProjection(BaseModel):
    days_elapsed: int
    days_in_month: int
    current_spent: float
    average_daily_spend: float
    projected_month_end_spend: float
    current_income: float
    projected_surplus_or_deficit: float


class InsightsReport(BaseModel):
    month: str
    rule_based_insights: List[SpendingInsightItem]
    burn_rate_projection: BurnRateProjection
    ai_summary: str
    ai_powered: bool
