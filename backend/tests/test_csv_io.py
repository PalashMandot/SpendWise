import io
from datetime import date


def test_csv_export(client, auth_headers_a):
    cats = client.get("/api/categories", headers=auth_headers_a).json()
    cat_id = cats[0]["id"]

    client.post(
        "/api/transactions",
        headers=auth_headers_a,
        json={
            "category_id": cat_id,
            "amount": 88.0,
            "type": "expense",
            "description": "Export Sample Transaction",
            "date": str(date.today())
        }
    )

    resp = client.get("/api/csv/export", headers=auth_headers_a)
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    assert "Export Sample Transaction" in resp.text
    assert "Date,Amount,Type,Category,Description" in resp.text


def test_csv_preview_and_import_with_duplicates(client, auth_headers_a):
    cats = client.get("/api/categories", headers=auth_headers_a).json()
    cat_id = cats[0]["id"]
    today_str = str(date.today())

    # Pre-insert a transaction to test duplicate detection
    client.post(
        "/api/transactions",
        headers=auth_headers_a,
        json={
            "category_id": cat_id,
            "amount": 25.0,
            "type": "expense",
            "description": "Coffee Shop Run",
            "date": today_str
        }
    )

    csv_data = (
        "Date,Amount,Type,Category,Description,Payment Method,Notes\n"
        f"{today_str},25.00,expense,Dining & Cafes,Coffee Shop Run,credit_card,Morning espresso\n"
        f"{today_str},95.50,expense,Groceries,Supermarket haul,debit_card,Pantry essentials\n"
    )

    # Preview
    preview_resp = client.post(
        "/api/csv/preview",
        headers=auth_headers_a,
        files={"file": ("transactions.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    )
    assert preview_resp.status_code == 200
    preview_json = preview_resp.json()
    assert preview_json["total_rows"] == 2
    assert preview_json["duplicate_rows"] == 1
    assert preview_json["valid_rows"] == 1

    # Execute import skipping duplicates
    import_resp = client.post(
        "/api/csv/import?skip_duplicates=true",
        headers=auth_headers_a,
        json=preview_json["rows"]
    )
    assert import_resp.status_code == 200
    import_json = import_resp.json()
    assert import_json["imported_count"] == 1
    assert import_json["skipped_duplicates_count"] == 1
