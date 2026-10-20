from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.recurring import RecurringTransaction

SYSTEM_CATEGORIES = [
    {"name": "Housing & Rent", "type": "expense", "color": "#EF4444", "icon": "home"},
    {"name": "Groceries", "type": "expense", "color": "#10B981", "icon": "shopping-cart"},
    {"name": "Dining & Cafes", "type": "expense", "color": "#F59E0B", "icon": "utensils"},
    {"name": "Transportation", "type": "expense", "color": "#3B82F6", "icon": "car"},
    {"name": "Utilities & Bills", "type": "expense", "color": "#6366F1", "icon": "zap"},
    {"name": "Entertainment", "type": "expense", "color": "#EC4899", "icon": "tv"},
    {"name": "Healthcare & Fitness", "type": "expense", "color": "#14B8A6", "icon": "heart-pulse"},
    {"name": "Shopping & Electronics", "type": "expense", "color": "#8B5CF6", "icon": "shopping-bag"},
    {"name": "Travel", "type": "expense", "color": "#F97316", "icon": "plane"},
    {"name": "Salary & Wages", "type": "income", "color": "#059669", "icon": "briefcase"},
    {"name": "Freelance & Consulting", "type": "income", "color": "#0284C7", "icon": "laptop"},
    {"name": "Investments & Dividends", "type": "income", "color": "#7C3AED", "icon": "trending-up"},
    {"name": "Other", "type": "both", "color": "#64748B", "icon": "more-horizontal"},
]


def seed_default_categories(db: Session) -> None:
    """Ensure core default categories exist in the database."""
    for cat_data in SYSTEM_CATEGORIES:
        exists = db.query(Category.id).filter(
            Category.is_system == True,
            Category.name == cat_data["name"]
        ).first()
        if not exists:
            db.add(Category(
                user_id=None,
                is_system=True,
                name=cat_data["name"],
                type=cat_data["type"],
                color=cat_data["color"],
                icon=cat_data["icon"]
            ))
    db.commit()


def seed_user_demo_data(db: Session, user_id: int) -> int:
    """Populates realistic transactions, recurring rules, and budgets across 3 months."""
    seed_default_categories(db)
    
    # Preload categories by name
    categories = db.query(Category).filter(
        (Category.user_id == user_id) | (Category.is_system == True)
    ).all()
    cat_map = {c.name: c.id for c in categories}
    fallback_cat = next(iter(cat_map.values()))

    today = date.today()
    created_txns = 0

    # 1. Clear existing user transactions and budgets to prevent duplicate demo data
    db.query(Transaction).filter(Transaction.user_id == user_id).delete()
    db.query(Budget).filter(Budget.user_id == user_id).delete()
    db.query(RecurringTransaction).filter(RecurringTransaction.user_id == user_id).delete()
    db.commit()

    # Generate 3 months of data (past 2 months + current month)
    demo_schedule = [
        # (day_offset, amount, type, category_name, description, payment_method, is_recurring)
        # Recurring monthly salary & freelance
        (-60, 4800.0, "income", "Salary & Wages", "Tech Corp Monthly Payroll", "bank_transfer", True),
        (-45, 650.0, "income", "Freelance & Consulting", "UI Design Sprint Client Payment", "bank_transfer", False),
        (-30, 4800.0, "income", "Salary & Wages", "Tech Corp Monthly Payroll", "bank_transfer", True),
        (-15, 800.0, "income", "Freelance & Consulting", "Full-Stack Consultation", "bank_transfer", False),
        (-2, 4800.0, "income", "Salary & Wages", "Tech Corp Monthly Payroll", "bank_transfer", True),
        
        # Monthly Rent
        (-58, 1450.0, "expense", "Housing & Rent", "Downtown Apartment Lease", "bank_transfer", True),
        (-28, 1450.0, "expense", "Housing & Rent", "Downtown Apartment Lease", "bank_transfer", True),
        (-1, 1450.0, "expense", "Housing & Rent", "Downtown Apartment Lease", "bank_transfer", True),

        # Utilities
        (-55, 135.50, "expense", "Utilities & Bills", "Electric & Water Utility Board", "credit_card", True),
        (-54, 85.00, "expense", "Utilities & Bills", "Fiber Gigabit Internet", "credit_card", True),
        (-25, 142.20, "expense", "Utilities & Bills", "Electric & Water Utility Board", "credit_card", True),
        (-24, 85.00, "expense", "Utilities & Bills", "Fiber Gigabit Internet", "credit_card", True),
        (-5, 85.00, "expense", "Utilities & Bills", "Fiber Gigabit Internet", "credit_card", True),

        # Groceries
        (-56, 142.60, "expense", "Groceries", "Whole Foods Weekly Market", "debit_card", False),
        (-49, 128.40, "expense", "Groceries", "Trader Joe's Pantry Stock", "debit_card", False),
        (-42, 165.10, "expense", "Groceries", "Costco Wholesale Bulk Run", "credit_card", False),
        (-35, 115.80, "expense", "Groceries", "Whole Foods Weekly Market", "debit_card", False),
        (-27, 138.90, "expense", "Groceries", "Whole Foods Weekly Market", "debit_card", False),
        (-20, 155.30, "expense", "Groceries", "Trader Joe's Provisions", "debit_card", False),
        (-13, 122.50, "expense", "Groceries", "Farmers Market Fresh Produce", "cash", False),
        (-6, 145.20, "expense", "Groceries", "Whole Foods Weekly Market", "debit_card", False),
        (-1, 68.40, "expense", "Groceries", "Local Green Grocer Essentials", "debit_card", False),

        # Dining & Cafes
        (-57, 45.00, "expense", "Dining & Cafes", "Artisan Pizzeria Dinner", "credit_card", False),
        (-52, 18.50, "expense", "Dining & Cafes", "Third Wave Espresso Bar", "credit_card", False),
        (-48, 72.00, "expense", "Dining & Cafes", "Sushi Omakase Dinner", "credit_card", False),
        (-40, 24.50, "expense", "Dining & Cafes", "Downtown Bistro Lunch", "credit_card", False),
        (-33, 58.00, "expense", "Dining & Cafes", "Taco Guild Weekend Brunch", "credit_card", False),
        (-26, 64.00, "expense", "Dining & Cafes", "Thai Basil Dinner with Friends", "credit_card", False),
        (-19, 32.00, "expense", "Dining & Cafes", "Ramen Bowl & Gyoza", "credit_card", False),
        (-12, 85.50, "expense", "Dining & Cafes", "Italian Trattoria Date Night", "credit_card", False),
        (-7, 22.00, "expense", "Dining & Cafes", "Coffee & Bakery Snacks", "credit_card", False),
        (-3, 48.50, "expense", "Dining & Cafes", "Wood-Fired Pizza & Drinks", "credit_card", False),

        # Transportation
        (-53, 52.00, "expense", "Transportation", "Chevron Fuel Station", "credit_card", False),
        (-44, 28.50, "expense", "Transportation", "Uber Ride Downtown", "credit_card", False),
        (-38, 55.00, "expense", "Transportation", "Shell Gas Refill", "credit_card", False),
        (-23, 31.00, "expense", "Transportation", "Metro Transit Pass Recharge", "credit_card", False),
        (-14, 54.00, "expense", "Transportation", "Chevron Fuel Station", "credit_card", False),
        (-4, 22.50, "expense", "Transportation", "Lyft Ride Home", "credit_card", False),

        # Entertainment & Subscriptions
        (-58, 22.99, "expense", "Entertainment", "Netflix 4K Premium Plan", "credit_card", True),
        (-58, 11.99, "expense", "Entertainment", "Spotify Family Subscription", "credit_card", True),
        (-28, 22.99, "expense", "Entertainment", "Netflix 4K Premium Plan", "credit_card", True),
        (-28, 11.99, "expense", "Entertainment", "Spotify Family Subscription", "credit_card", True),
        (-16, 75.00, "expense", "Entertainment", "IMAX Movie Tickets & Concessions", "credit_card", False),
        (-2, 22.99, "expense", "Entertainment", "Netflix 4K Premium Plan", "credit_card", True),
        (-2, 11.99, "expense", "Entertainment", "Spotify Family Subscription", "credit_card", True),

        # Healthcare & Fitness
        (-50, 65.00, "expense", "Healthcare & Fitness", "Equinox Fitness Monthly Pass", "credit_card", True),
        (-21, 65.00, "expense", "Healthcare & Fitness", "Equinox Fitness Monthly Pass", "credit_card", True),
        (-10, 42.00, "expense", "Healthcare & Fitness", "Pharmacy Wellness Supplements", "credit_card", False),

        # Shopping
        (-46, 129.99, "expense", "Shopping & Electronics", "Mechanical Keyboard Upgrade", "credit_card", False),
        (-18, 89.00, "expense", "Shopping & Electronics", "Autumn Apparel Jacket", "credit_card", False),
        (-8, 39.50, "expense", "Shopping & Electronics", "Technical Books on Architecture", "credit_card", False),
    ]

    for offset, amt, tx_type, cat_name, desc, method, is_rec in demo_schedule:
        txn_date = today + timedelta(days=offset)
        cat_id = cat_map.get(cat_name, fallback_cat)
        txn = Transaction(
            user_id=user_id,
            category_id=cat_id,
            amount=amt,
            type=tx_type,
            description=desc,
            date=txn_date,
            payment_method=method,
            notes="Sample demo data for SpendWise portfolio demonstration",
            is_recurring=is_rec
        )
        db.add(txn)
        created_txns += 1

    # 2. Add Monthly Budgets for the current month
    curr_month_str = today.strftime("%Y-%m")
    demo_budgets = [
        ("Groceries", 600.0, 0.85),
        ("Dining & Cafes", 350.0, 0.80),
        ("Housing & Rent", 1500.0, 0.95),
        ("Transportation", 200.0, 0.80),
        ("Entertainment", 150.0, 0.75),
    ]

    for cat_name, b_amt, thresh in demo_budgets:
        if cat_name in cat_map:
            db.add(Budget(
                user_id=user_id,
                category_id=cat_map[cat_name],
                month=curr_month_str,
                amount=b_amt,
                alert_threshold=thresh
            ))

    # Also add an overall monthly budget
    db.add(Budget(
        user_id=user_id,
        category_id=None,
        month=curr_month_str,
        amount=3200.0,
        alert_threshold=0.85
    ))

    # 3. Add recurring rules
    if "Housing & Rent" in cat_map:
        db.add(RecurringTransaction(
            user_id=user_id,
            category_id=cat_map["Housing & Rent"],
            amount=1450.0,
            type="expense",
            description="Downtown Apartment Lease",
            frequency="monthly",
            start_date=today - timedelta(days=90),
            next_due_date=today + timedelta(days=28),
            payment_method="bank_transfer",
            is_active=True
        ))
    if "Salary & Wages" in cat_map:
        db.add(RecurringTransaction(
            user_id=user_id,
            category_id=cat_map["Salary & Wages"],
            amount=4800.0,
            type="income",
            description="Tech Corp Monthly Payroll",
            frequency="monthly",
            start_date=today - timedelta(days=90),
            next_due_date=today + timedelta(days=26),
            payment_method="bank_transfer",
            is_active=True
        ))

    db.commit()
    return created_txns


def reset_user_data(db: Session, user_id: int) -> None:
    """Removes all transactions, budgets, custom categories, and recurring rules for a user."""
    db.query(Transaction).filter(Transaction.user_id == user_id).delete()
    db.query(Budget).filter(Budget.user_id == user_id).delete()
    db.query(RecurringTransaction).filter(RecurringTransaction.user_id == user_id).delete()
    db.query(Category).filter(Category.user_id == user_id).delete()
    db.commit()
