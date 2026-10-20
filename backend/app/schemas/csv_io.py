from typing import List, Optional
from pydantic import BaseModel


class CSVImportRow(BaseModel):
    row_number: int
    date: str
    amount: float
    type: str
    category: str
    description: str
    payment_method: str = "credit_card"
    notes: Optional[str] = None
    is_duplicate: bool = False
    validation_error: Optional[str] = None


class CSVImportPreviewResponse(BaseModel):
    total_rows: int
    valid_rows: int
    duplicate_rows: int
    error_rows: int
    rows: List[CSVImportRow]


class CSVImportResult(BaseModel):
    imported_count: int
    skipped_duplicates_count: int
    failed_count: int
    messages: List[str]
