def test_create_and_get_budget_status(client, auth_headers_a):
    cats = client.get("/api/categories", headers=auth_headers_a).json()
    cat_id = cats[0]["id"]
    month = "2026-10"

    # Create category budget
    resp = client.post(
        "/api/budgets",
        headers=auth_headers_a,
        json={
            "category_id": cat_id,
            "month": month,
            "amount": 200.0,
            "alert_threshold": 0.8
        }
    )
    assert resp.status_code == 201
    assert resp.json()["amount"] == 200.0

    # Add an expense of $170 for that category and month (85% spent -> should trigger warning status)
    client.post(
        "/api/transactions",
        headers=auth_headers_a,
        json={
            "category_id": cat_id,
            "amount": 170.0,
            "type": "expense",
            "description": "Large dinner party",
            "date": f"{month}-15"
        }
    )

    # Fetch budget status
    status_resp = client.get(f"/api/budgets?month={month}", headers=auth_headers_a)
    assert status_resp.status_code == 200
    statuses = status_resp.json()
    cat_status = next(s for s in statuses if s["category_id"] == cat_id)
    assert cat_status["spent"] == 170.0
    assert cat_status["remaining"] == 30.0
    assert cat_status["percentage"] == 85.0
    assert cat_status["status"] == "warning"

    # Add another $50 expense (total $220 -> exceeded)
    client.post(
        "/api/transactions",
        headers=auth_headers_a,
        json={
            "category_id": cat_id,
            "amount": 50.0,
            "type": "expense",
            "description": "Late night delivery",
            "date": f"{month}-16"
        }
    )

    status_resp2 = client.get(f"/api/budgets?month={month}", headers=auth_headers_a)
    statuses2 = status_resp2.json()
    cat_status2 = next(s for s in statuses2 if s["category_id"] == cat_id)
    assert cat_status2["spent"] == 220.0
    assert cat_status2["remaining"] == -20.0
    assert cat_status2["percentage"] == 110.0
    assert cat_status2["status"] == "exceeded"
