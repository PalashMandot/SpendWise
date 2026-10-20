import io
import csv
from datetime import datetime, date
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.models.category import Category
from app.schemas.csv_io import CSVImportRow, CSVImportPreviewResponse, CSVImportResult


def export_transactions_to_csv(transactions: List[Transaction]) -> str:
    """Generate a clean RFC-4180 CSV string from a list of transactions."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["Date", "Amount", "Type", "Category", "Description", "Payment Method", "Notes"])
    
    for t in transactions:
        cat_name = t.category.name if t.category else "Other"
        writer.writerow([
            t.date.strftime("%Y-%m-%d"),
            f"{t.amount:.2f}",
            t.type,
            cat_name,
            t.description,
            t.payment_method,
            t.notes or ""
        ])
        
    return output.getvalue()


def parse_date_flexible(val: str) -> date:
    val = val.strip()
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(val, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Unrecognized date format: '{val}'. Expected YYYY-MM-DD.")


def normalize_headers(raw_headers: List[str]) -> Dict[str, int]:
    """Map flexible header names to canonical fields."""
    mapping = {}
    for idx, h in enumerate(raw_headers):
        clean = h.strip().lower().replace("_", " ").replace("-", " ")
        if clean in ("date", "transaction date", "txn date"):
            mapping["date"] = idx
        elif clean in ("amount", "cost", "value", "price"):
            mapping["amount"] = idx
        elif clean in ("type", "transaction type", "entry type"):
            mapping["type"] = idx
        elif clean in ("category", "category name", "tag"):
            mapping["category"] = idx
        elif clean in ("description", "desc", "name", "merchant", "details", "payee"):
            mapping["description"] = idx
        elif clean in ("payment method", "payment", "method", "account"):
            mapping["payment_method"] = idx
        elif clean in ("notes", "note", "comment", "memo"):
            mapping["notes"] = idx
    return mapping


def preview_csv_import(csv_content: str, db: Session, user_id: int) -> CSVImportPreviewResponse:
    reader = csv.reader(io.StringIO(csv_content))
    rows = list(reader)
    if not rows:
        return CSVImportPreviewResponse(total_rows=0, valid_rows=0, duplicate_rows=0, error_rows=0, rows=[])

    raw_headers = rows[0]
    header_map = normalize_headers(raw_headers)

    required_fields = ["date", "amount", "description"]
    missing = [f for f in required_fields if f not in header_map]
    if missing:
        raise ValueError(f"Missing required CSV columns: {', '.join(missing)}. Found: {', '.join(raw_headers)}")

    # Pre-fetch user and system categories for quick lookup
    categories = db.query(Category).filter(
        (Category.user_id == user_id) | (Category.is_system == True)
    ).all()
    cat_lookup = {c.name.strip().lower(): c for c in categories}

    preview_rows: List[CSVImportRow] = []
    valid_count = 0
    duplicate_count = 0
    error_count = 0

    for row_idx, row in enumerate(rows[1:], start=2):
        if not row or all(not cell.strip() for cell in row):
            continue  # skip empty lines

        row_error = None
        parsed_date_str = ""
        parsed_amount = 0.0
        parsed_type = "expense"
        parsed_cat = "Other"
        parsed_desc = ""
        parsed_method = "credit_card"
        parsed_notes = None
        is_dup = False

        try:
            # 1. Date
            raw_date = row[header_map["date"]].strip() if "date" in header_map and len(row) > header_map["date"] else ""
            parsed_date = parse_date_flexible(raw_date)
            parsed_date_str = parsed_date.strftime("%Y-%m-%d")

            # 2. Amount
            raw_amt = row[header_map["amount"]].strip().replace("$", "").replace(",", "") if "amount" in header_map and len(row) > header_map["amount"] else ""
            parsed_amount = float(raw_amt)
            if parsed_amount <= 0:
                raise ValueError("Amount must be greater than zero.")

            # 3. Description
            parsed_desc = row[header_map["description"]].strip() if "description" in header_map and len(row) > header_map["description"] else "Transaction"
            if not parsed_desc:
                raise ValueError("Description cannot be empty.")

            # 4. Type
            if "type" in header_map and len(row) > header_map["type"]:
                raw_type = row[header_map["type"]].strip().lower()
                if raw_type in ("income", "credit", "deposit"):
                    parsed_type = "income"
                elif raw_type in ("expense", "debit", "withdrawal"):
                    parsed_type = "expense"
                else:
                    parsed_type = "expense"

            # 5. Category
            if "category" in header_map and len(row) > header_map["category"]:
                parsed_cat = row[header_map["category"]].strip() or "Other"

            # 6. Payment Method
            if "payment_method" in header_map and len(row) > header_map["payment_method"]:
                raw_method = row[header_map["payment_method"]].strip().lower().replace(" ", "_")
                if raw_method in ("credit_card", "debit_card", "cash", "bank_transfer", "other"):
                    parsed_method = raw_method
                else:
                    parsed_method = "other"

            # 7. Notes
            if "notes" in header_map and len(row) > header_map["notes"]:
                parsed_notes = row[header_map["notes"]].strip() or None

            # Check for duplicate in database (matching user, date, amount, description)
            existing = db.query(Transaction.id).filter(
                Transaction.user_id == user_id,
                Transaction.date == parsed_date,
                Transaction.amount == parsed_amount,
                Transaction.description.ilike(parsed_desc)
            ).first()

            if existing:
                is_dup = True
                duplicate_count += 1
            else:
                valid_count += 1

        except Exception as e:
            row_error = str(e)
            error_count += 1

        preview_rows.append(CSVImportRow(
            row_number=row_idx,
            date=parsed_date_str,
            amount=round(parsed_amount, 2),
            type=parsed_type,
            category=parsed_cat,
            description=parsed_desc,
            payment_method=parsed_method,
            notes=parsed_notes,
            is_duplicate=is_dup,
            validation_error=row_error
        ))

    return CSVImportPreviewResponse(
        total_rows=len(preview_rows),
        valid_rows=valid_count,
        duplicate_rows=duplicate_count,
        error_rows=error_count,
        rows=preview_rows
    )


def execute_csv_import(
    rows: List[CSVImportRow],
    db: Session,
    user_id: int,
    skip_duplicates: bool = True
) -> CSVImportResult:
    """Inserts validated preview rows into the database."""
    # Pre-fetch categories
    categories = db.query(Category).filter(
        (Category.user_id == user_id) | (Category.is_system == True)
    ).all()
    cat_lookup = {c.name.strip().lower(): c for c in categories}

    imported_count = 0
    skipped_count = 0
    failed_count = 0
    messages: List[str] = []

    for r in rows:
        if r.validation_error:
            failed_count += 1
            messages.append(f"Row {r.row_number}: Skipped due to error: {r.validation_error}")
            continue

        if r.is_duplicate and skip_duplicates:
            skipped_count += 1
            continue

        try:
            # Resolve category or create user custom category
            cat_key = r.category.strip().lower()
            if cat_key in cat_lookup:
                target_cat = cat_lookup[cat_key]
            else:
                # Create category for user
                target_cat = Category(
                    user_id=user_id,
                    name=r.category.strip() or "Other",
                    type=r.type,
                    color="#6366F1",
                    icon="tag",
                    is_system=False
                )
                db.add(target_cat)
                db.flush()
                cat_lookup[cat_key] = target_cat

            # Create transaction
            parsed_date = datetime.strptime(r.date, "%Y-%m-%d").date()
            txn = Transaction(
                user_id=user_id,
                category_id=target_cat.id,
                amount=r.amount,
                type=r.type,
                description=r.description,
                date=parsed_date,
                payment_method=r.payment_method,
                notes=r.notes,
                is_recurring=False
            )
            db.add(txn)
            imported_count += 1
        except Exception as e:
            failed_count += 1
            messages.append(f"Row {r.row_number}: Failed to insert: {str(e)}")

    db.commit()
    return CSVImportResult(
        imported_count=imported_count,
        skipped_duplicates_count=skipped_count,
        failed_count=failed_count,
        messages=messages
    )
