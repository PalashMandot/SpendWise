from datetime import date
from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.csv_io import CSVImportRow, CSVImportPreviewResponse, CSVImportResult
from app.services.csv_service import export_transactions_to_csv, preview_csv_import, execute_csv_import
from app.api.deps import get_current_user

router = APIRouter(prefix="/csv", tags=["CSV Import & Export"])


@router.get("/export")
def export_csv(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    type: Optional[str] = Query(None, pattern="^(income|expense)$"),
    category_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Export filtered user transactions to standard CSV format."""
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    if type:
        query = query.filter(Transaction.type == type)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)

    transactions = query.order_by(desc(Transaction.date), desc(Transaction.id)).all()
    csv_data = export_transactions_to_csv(transactions)

    filename = f"spendwise_transactions_{date.today().strftime('%Y%m%d')}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/preview", response_model=CSVImportPreviewResponse)
async def preview_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Upload a CSV file to validate columns, parse rows, and detect duplicates before importing."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be a valid .csv file")
    
    contents = await file.read()
    try:
        csv_text = contents.decode("utf-8")
    except UnicodeDecodeError:
        try:
            csv_text = contents.decode("latin-1")
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unable to decode CSV text encoding.")

    try:
        preview_result = preview_csv_import(csv_text, db, current_user.id)
        return preview_result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/import", response_model=CSVImportResult)
def import_csv_rows(
    rows: List[CSVImportRow],
    skip_duplicates: bool = Query(True, description="Whether to ignore detected duplicate rows"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Execute the batch import of pre-validated CSV rows into user account."""
    if not rows:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No rows provided for import")

    result = execute_csv_import(rows, db, current_user.id, skip_duplicates=skip_duplicates)
    return result
