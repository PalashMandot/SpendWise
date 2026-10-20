import logging
from typing import List, Tuple, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)


def generate_heuristic_summary(
    month_str: str,
    income: float,
    expense: float,
    burn_rate: any,
    insights: List[any],
    top_category: Optional[str]
) -> str:
    """Generate a structured, professional financial summary using transparent rules."""
    net = income - expense
    savings_rate = round((net / income * 100), 1) if income > 0 else 0.0

    lines = []
    lines.append(f"### Financial Executive Summary ({month_str})\n")

    if income == 0 and expense == 0:
        return "No financial activity recorded for this period yet. Add transactions to unlock AI-assisted financial overviews."

    # Status overview
    if net > 0:
        lines.append(
            f"You are operating with a **positive net surplus of ${net:,.2f}** ({savings_rate}% savings rate). "
            f"Total inflows stand at **${income:,.2f}** against **${expense:,.2f}** in outflows."
        )
    else:
        lines.append(
            f"You currently have a **net deficit of -${abs(net):,.2f}**. "
            f"Inflows are **${income:,.2f}** while expenses have reached **${expense:,.2f}**."
        )

    # Burn rate & projections
    lines.append(
        f"\n**Burn Rate & Forecast:** Based on an average daily expenditure of **${burn_rate.average_daily_spend:,.2f}**, "
        f"your projected end-of-month spend is **${burn_rate.projected_month_end_spend:,.2f}**, "
        f"which yields a projected {'surplus' if burn_rate.projected_surplus_or_deficit >= 0 else 'deficit'} of "
        f"**${abs(burn_rate.projected_surplus_or_deficit):,.2f}**."
    )

    # Top drivers
    if top_category:
        lines.append(f"\n**Primary Outflow Driver:** **{top_category}** remains your highest expenditure category.")

    # Actionable takeaways
    lines.append("\n**Actionable Recommendations:**")
    if savings_rate < 15 and income > 0:
        lines.append("• Consider trimming non-essential recurring subscriptions or weekend leisure expenses to boost your monthly savings buffer toward 20%.")
    elif savings_rate >= 20:
        lines.append("• Exceptional savings momentum! Consider allocating surplus funds into an emergency high-yield reserve or automated index investments.")
    else:
        lines.append("• Maintain your current pace while keeping category budget thresholds monitored to avoid end-of-month spikes.")

    return "\n".join(lines)


def generate_ai_summary(
    month_str: str,
    income: float,
    expense: float,
    burn_rate: any,
    insights: List[any],
    top_category: Optional[str]
) -> Tuple[str, bool]:
    """
    Returns (summary_text, is_ai_powered)
    Uses Gemini API if key is present, else gracefully falls back to deterministic heuristic rules.
    """
    if not settings.GEMINI_API_KEY:
        return generate_heuristic_summary(month_str, income, expense, burn_rate, insights, top_category), False

    # Attempt to query Gemini API via direct REST request
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        
        prompt = (
            f"You are a friendly senior personal finance advisor for the SpendWise app. "
            f"Summarize the user's spending for month {month_str}.\n"
            f"- Total Inflows: ${income:,.2f}\n"
            f"- Total Outflows: ${expense:,.2f}\n"
            f"- Net Balance: ${income - expense:,.2f}\n"
            f"- Average Daily Spend: ${burn_rate.average_daily_spend:,.2f}\n"
            f"- Projected Month-End Spend: ${burn_rate.projected_month_end_spend:,.2f}\n"
            f"- Top Category: {top_category or 'N/A'}\n"
            f"Write a concise, encouraging 3-paragraph summary in markdown with key highlights and 2 practical tips. "
            f"Do not use generic disclaimers."
        )

        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 400
            }
        }

        with httpx.Client(timeout=8.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text.strip(), True
            else:
                logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.warning(f"Could not connect to Gemini API: {str(e)}. Using fallback rules.")

    return generate_heuristic_summary(month_str, income, expense, burn_rate, insights, top_category), False
