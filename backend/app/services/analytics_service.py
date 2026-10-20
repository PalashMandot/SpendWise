from datetime import date, datetime, timedelta
import calendar
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract

from app.models.transaction import Transaction
from app.models.category import Category
from app.models.budget import Budget
from app.schemas.analytics import (
    StatCardSummary,
    CategorySpendItem,
    MonthlyCashFlowItem,
    DailySpendItem,
    DashboardData,
    SpendingInsightItem,
    BurnRateProjection,
    InsightsReport
)
from app.schemas.transaction import TransactionOut
from app.schemas.budget import BudgetStatus
from app.services.ai_service import generate_ai_summary


def get_current_month_str() -> str:
    return date.today().strftime("%Y-%m")


def get_month_date_range(month_str: str):
    """Parse 'YYYY-MM' into start_date and end_date."""
    year, month = map(int, month_str.split("-"))
    _, last_day = calendar.monthrange(year, month)
    start_date = date(year, month, 1)
    end_date = date(year, month, last_day)
    return start_date, end_date


def get_dashboard_summary(db: Session, user_id: int, month_str: Optional[str] = None) -> DashboardData:
    if not month_str:
        month_str = get_current_month_str()
    
    start_date, end_date = get_month_date_range(month_str)

    # 1. Total Income & Total Expense for this month
    income_sum = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.user_id == user_id,
        Transaction.type == "income",
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).scalar() or 0.0

    expense_sum = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.user_id == user_id,
        Transaction.type == "expense",
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).scalar() or 0.0

    net_balance = round(income_sum - expense_sum, 2)
    savings_rate = round((net_balance / income_sum * 100) if income_sum > 0 else 0.0, 1)

    # 2. Budgets for this month
    budgets = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.month == month_str
    ).all()

    total_budgeted = sum(b.amount for b in budgets)
    budget_usage_percent = round((expense_sum / total_budgeted * 100) if total_budgeted > 0 else 0.0, 1)

    # Calculate budget alerts
    budget_alerts: List[BudgetStatus] = []
    for b in budgets:
        # If category_id is set, calculate spent for this category; else overall
        query = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
            Transaction.user_id == user_id,
            Transaction.type == "expense",
            Transaction.date >= start_date,
            Transaction.date <= end_date
        )
        if b.category_id:
            query = query.filter(Transaction.category_id == b.category_id)
        
        cat_spent = query.scalar() or 0.0
        remaining = round(b.amount - cat_spent, 2)
        pct = round((cat_spent / b.amount * 100) if b.amount > 0 else 0.0, 1)

        if pct >= 100.0:
            status = "exceeded"
        elif pct >= (b.alert_threshold * 100):
            status = "warning"
        else:
            status = "normal"

        budget_status = BudgetStatus(
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
            status=status
        )
        budget_alerts.append(budget_status)

    # 3. Category Breakdown for expenses
    cat_query = db.query(
        Category.id,
        Category.name,
        Category.color,
        Category.icon,
        func.sum(Transaction.amount).label("total")
    ).join(Transaction, Transaction.category_id == Category.id).filter(
        Transaction.user_id == user_id,
        Transaction.type == "expense",
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).group_by(Category.id, Category.name, Category.color, Category.icon).all()

    category_breakdown: List[CategorySpendItem] = []
    for c_id, c_name, c_color, c_icon, total in cat_query:
        pct = round((total / expense_sum * 100) if expense_sum > 0 else 0.0, 1)
        category_breakdown.append(CategorySpendItem(
            category_id=c_id,
            category_name=c_name,
            color=c_color,
            icon=c_icon,
            total=round(total, 2),
            percentage=pct
        ))
    category_breakdown.sort(key=lambda x: x.total, reverse=True)

    # 4. Monthly Cash Flow (Past 6 months)
    current_dt = datetime.strptime(month_str, "%Y-%m")
    monthly_cash_flow: List[MonthlyCashFlowItem] = []
    
    for i in range(5, -1, -1):
        # Calculate target year and month
        target_year = current_dt.year
        target_month = current_dt.month - i
        while target_month <= 0:
            target_month += 12
            target_year -= 1
        
        m_str = f"{target_year:04d}-{target_month:02d}"
        s_date, e_date = get_month_date_range(m_str)

        m_inc = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
            Transaction.user_id == user_id,
            Transaction.type == "income",
            Transaction.date >= s_date,
            Transaction.date <= e_date
        ).scalar() or 0.0

        m_exp = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
            Transaction.user_id == user_id,
            Transaction.type == "expense",
            Transaction.date >= s_date,
            Transaction.date <= e_date
        ).scalar() or 0.0

        monthly_cash_flow.append(MonthlyCashFlowItem(
            month=m_str,
            income=round(m_inc, 2),
            expense=round(m_exp, 2),
            net=round(m_inc - m_exp, 2)
        ))

    # 5. Daily Spending for the selected month
    daily_query = db.query(
        Transaction.date,
        func.sum(Transaction.amount).label("total")
    ).filter(
        Transaction.user_id == user_id,
        Transaction.type == "expense",
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).group_by(Transaction.date).order_by(Transaction.date.asc()).all()

    daily_spending = [
        DailySpendItem(date=d.strftime("%Y-%m-%d"), amount=round(amt, 2))
        for d, amt in daily_query
    ]

    # 6. Recent 5 Transactions
    recent_txs = db.query(Transaction).filter(
        Transaction.user_id == user_id
    ).order_by(Transaction.date.desc(), Transaction.id.desc()).limit(5).all()

    recent_out = [TransactionOut.model_validate(t) for t in recent_txs]

    summary = StatCardSummary(
        total_income=round(income_sum, 2),
        total_expense=round(expense_sum, 2),
        net_balance=net_balance,
        savings_rate=savings_rate,
        total_budgeted=round(total_budgeted, 2),
        budget_usage_percent=budget_usage_percent
    )

    return DashboardData(
        summary=summary,
        recent_transactions=recent_out,
        category_breakdown=category_breakdown,
        monthly_cash_flow=monthly_cash_flow,
        daily_spending=daily_spending,
        budget_alerts=[b for b in budget_alerts if b.status in ("warning", "exceeded")]
    )


def calculate_insights_and_projections(db: Session, user_id: int, month_str: Optional[str] = None) -> InsightsReport:
    if not month_str:
        month_str = get_current_month_str()
    
    start_date, end_date = get_month_date_range(month_str)
    year, month = map(int, month_str.split("-"))
    _, days_in_month = calendar.monthrange(year, month)
    
    # Days elapsed in the month (if current month, up to today; if past month, all days)
    today = date.today()
    if today < start_date:
        days_elapsed = 1
    elif today > end_date:
        days_elapsed = days_in_month
    else:
        days_elapsed = max(today.day, 1)

    # Current month expenses and income
    current_spent = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.user_id == user_id,
        Transaction.type == "expense",
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).scalar() or 0.0

    current_income = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.user_id == user_id,
        Transaction.type == "income",
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).scalar() or 0.0

    # Previous month range
    prev_year = year if month > 1 else year - 1
    prev_month = month - 1 if month > 1 else 12
    prev_month_str = f"{prev_year:04d}-{prev_month:02d}"
    prev_start_date, prev_end_date = get_month_date_range(prev_month_str)

    prev_spent = db.query(func.coalesce(func.sum(Transaction.amount), 0.0)).filter(
        Transaction.user_id == user_id,
        Transaction.type == "expense",
        Transaction.date >= prev_start_date,
        Transaction.date <= prev_end_date
    ).scalar() or 0.0

    # 1. Burn Rate Calculation
    avg_daily_spend = round(current_spent / days_elapsed, 2) if days_elapsed > 0 else 0.0
    projected_spend = round(avg_daily_spend * days_in_month, 2)
    projected_surplus = round(current_income - projected_spend, 2)

    burn_rate = BurnRateProjection(
        days_elapsed=days_elapsed,
        days_in_month=days_in_month,
        current_spent=round(current_spent, 2),
        average_daily_spend=avg_daily_spend,
        projected_month_end_spend=projected_spend,
        current_income=round(current_income, 2),
        projected_surplus_or_deficit=projected_surplus
    )

    # 2. Rule-Based Statistical Insights
    insights: List[SpendingInsightItem] = []

    # Rule 1: Overall MoM spending change
    if prev_spent > 0:
        mom_change = round(((current_spent - prev_spent) / prev_spent) * 100, 1)
        if mom_change > 15:
            insights.append(SpendingInsightItem(
                id="mom_increase",
                type="warning",
                title="Spending Accelerating",
                description=f"Your expenses are tracking {mom_change}% higher compared to the same time last month (${current_spent:,.2f} vs ${prev_spent:,.2f}).",
                metric=f"+{mom_change}%",
                impact="Higher outflow"
            ))
        elif mom_change < -10:
            insights.append(SpendingInsightItem(
                id="mom_decrease",
                type="success",
                title="Great Spending Discipline",
                description=f"You are spending {abs(mom_change)}% less than last month. Excellent budgeting control!",
                metric=f"{mom_change}%",
                impact="Savings boost"
            ))

    # Rule 2: Top spending category & category MoM
    top_cat = db.query(
        Category.name,
        func.sum(Transaction.amount).label("total")
    ).join(Transaction, Transaction.category_id == Category.id).filter(
        Transaction.user_id == user_id,
        Transaction.type == "expense",
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).group_by(Category.name).order_by(func.sum(Transaction.amount).desc()).first()

    if top_cat and current_spent > 0:
        cat_pct = round((top_cat.total / current_spent) * 100, 1)
        insights.append(SpendingInsightItem(
            id="top_category",
            type="info",
            title=f"Top Outflow: {top_cat.name}",
            description=f"{top_cat.name} accounts for {cat_pct}% of your total expenditures this month (${top_cat.total:,.2f}).",
            metric=f"{cat_pct}%",
            impact=f"${top_cat.total:,.2f}"
        ))

    # Rule 3: Weekend vs Weekday analysis
    txs = db.query(Transaction.date, Transaction.amount).filter(
        Transaction.user_id == user_id,
        Transaction.type == "expense",
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).all()

    if txs:
        weekend_spend = sum(t.amount for t in txs if t.date.weekday() >= 5)  # 5=Sat, 6=Sun
        weekday_spend = sum(t.amount for t in txs if t.date.weekday() < 5)
        total_tx_spend = weekend_spend + weekday_spend
        if total_tx_spend > 0:
            weekend_pct = round((weekend_spend / total_tx_spend) * 100, 1)
            if weekend_pct >= 40:
                insights.append(SpendingInsightItem(
                    id="weekend_heavy",
                    type="tip",
                    title="Weekend Outflow Pattern",
                    description=f"{weekend_pct}% of your spending occurs on Saturdays and Sundays. Planning weekend activities in advance can save up to 15%.",
                    metric=f"{weekend_pct}% weekends",
                    impact=f"${weekend_spend:,.2f}"
                ))

    # Rule 4: Largest Single Transaction
    largest_tx = db.query(Transaction).filter(
        Transaction.user_id == user_id,
        Transaction.type == "expense",
        Transaction.date >= start_date,
        Transaction.date <= end_date
    ).order_by(Transaction.amount.desc()).first()

    if largest_tx and current_spent > 0:
        tx_pct = round((largest_tx.amount / current_spent) * 100, 1)
        if tx_pct >= 20:
            insights.append(SpendingInsightItem(
                id="large_transaction",
                type="warning" if tx_pct >= 35 else "info",
                title="Major Expense Detected",
                description=f"'{largest_tx.description}' of ${largest_tx.amount:,.2f} on {largest_tx.date.strftime('%b %d')} represents {tx_pct}% of your monthly expenses.",
                metric=f"${largest_tx.amount:,.2f}",
                impact=f"{tx_pct}% of month"
            ))

    # Rule 5: Savings Rate & Financial Health
    if current_income > 0:
        net = current_income - current_spent
        rate = round((net / current_income) * 100, 1)
        if rate >= 20:
            insights.append(SpendingInsightItem(
                id="savings_milestone",
                type="success",
                title="Healthy Savings Rate",
                description=f"You are retaining {rate}% of your income this month. You are exceeding the recommended 20% savings rule!",
                metric=f"{rate}%",
                impact=f"+${net:,.2f} net"
            ))
        elif rate < 0:
            insights.append(SpendingInsightItem(
                id="deficit_warning",
                type="warning",
                title="Cash Flow Deficit Alert",
                description=f"Current expenses exceed income by ${abs(net):,.2f}. Review non-essential discretionary categories to prevent overdrawing.",
                metric=f"-${abs(net):,.2f}",
                impact="Negative cash flow"
            ))

    # Fallback insight if list is empty (new account)
    if not insights:
        insights.append(SpendingInsightItem(
            id="initial_welcome",
            type="info",
            title="Awaiting More Activity",
            description="Add a few more transactions or seed demo data to generate real-time behavioral insights and trend forecasts.",
            metric="0 transactions",
            impact="None yet"
        ))

    # 3. AI / Heuristic Summary
    summary_text, is_ai_powered = generate_ai_summary(
        month_str=month_str,
        income=current_income,
        expense=current_spent,
        burn_rate=burn_rate,
        insights=insights,
        top_category=top_cat.name if top_cat else None
    )

    return InsightsReport(
        month=month_str,
        rule_based_insights=insights,
        burn_rate_projection=burn_rate,
        ai_summary=summary_text,
        ai_powered=is_ai_powered
    )
