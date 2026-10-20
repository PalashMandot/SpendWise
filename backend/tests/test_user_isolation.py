from datetime import date


def test_user_cannot_access_other_users_transaction(client, auth_headers_a, auth_headers_b):
    # User A creates a transaction
    cats = client.get("/api/categories", headers=auth_headers_a).json()
    cat_id = cats[0]["id"]

    create_resp = client.post(
        "/api/transactions",
        headers=auth_headers_a,
        json={
            "category_id": cat_id,
            "amount": 120.0,
            "type": "expense",
            "description": "User A Private Confidential Expense",
            "date": str(date.today())
        }
    )
    txn_id = create_resp.json()["id"]

    # User B attempts to read User A's transaction directly
    read_resp = client.get(f"/api/transactions/{txn_id}", headers=auth_headers_b)
    assert read_resp.status_code == 404

    # User B attempts to update User A's transaction
    update_resp = client.put(
        f"/api/transactions/{txn_id}",
        headers=auth_headers_b,
        json={"amount": 999.0, "description": "Tampered description"}
    )
    assert update_resp.status_code == 404

    # User B attempts to delete User A's transaction
    del_resp = client.delete(f"/api/transactions/{txn_id}", headers=auth_headers_b)
    assert del_resp.status_code == 404

    # Verify User A's transaction was unmodified
    verify_resp = client.get(f"/api/transactions/{txn_id}", headers=auth_headers_a)
    assert verify_resp.status_code == 200
    assert verify_resp.json()["amount"] == 120.0
    assert verify_resp.json()["description"] == "User A Private Confidential Expense"


def test_user_transactions_list_isolation(client, auth_headers_a, auth_headers_b):
    cats = client.get("/api/categories", headers=auth_headers_a).json()
    cat_id = cats[0]["id"]

    # User A creates transaction
    client.post(
        "/api/transactions",
        headers=auth_headers_a,
        json={
            "category_id": cat_id,
            "amount": 300.0,
            "type": "income",
            "description": "User A Secret Bonus",
            "date": str(date.today())
        }
    )

    # User B lists transactions
    b_list = client.get("/api/transactions", headers=auth_headers_b).json()
    descriptions = [t["description"] for t in b_list["items"]]
    assert "User A Secret Bonus" not in descriptions


def test_user_budget_isolation(client, auth_headers_a, auth_headers_b):
    month = "2026-10"
    # User A creates budget
    create_resp = client.post(
        "/api/budgets",
        headers=auth_headers_a,
        json={
            "month": month,
            "amount": 1000.0,
            "alert_threshold": 0.8
        }
    )
    budget_id = create_resp.json()["id"]

    # User B attempts to delete User A's budget
    del_resp = client.delete(f"/api/budgets/{budget_id}", headers=auth_headers_b)
    assert del_resp.status_code == 404

    # User B queries budgets for that month
    b_budgets = client.get(f"/api/budgets?month={month}", headers=auth_headers_b).json()
    b_ids = [b["id"] for b in b_budgets]
    assert budget_id not in b_ids
