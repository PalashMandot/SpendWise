from datetime import date


def test_create_transaction_success(client, auth_headers_a):
    # Fetch available categories first
    cats = client.get("/api/categories", headers=auth_headers_a).json()
    assert len(cats) > 0
    cat_id = cats[0]["id"]

    response = client.post(
        "/api/transactions",
        headers=auth_headers_a,
        json={
            "category_id": cat_id,
            "amount": 75.50,
            "type": "expense",
            "description": "Weekly organic groceries",
            "date": str(date.today()),
            "payment_method": "credit_card",
            "notes": "Farm stand items"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == 75.50
    assert data["description"] == "Weekly organic groceries"
    assert data["category"]["id"] == cat_id


def test_create_transaction_invalid_amount(client, auth_headers_a):
    cats = client.get("/api/categories", headers=auth_headers_a).json()
    cat_id = cats[0]["id"]

    # Negative amount
    response = client.post(
        "/api/transactions",
        headers=auth_headers_a,
        json={
            "category_id": cat_id,
            "amount": -10.0,
            "type": "expense",
            "description": "Invalid negative expense",
            "date": str(date.today())
        }
    )
    assert response.status_code == 422


def test_create_transaction_invalid_category(client, auth_headers_a):
    response = client.post(
        "/api/transactions",
        headers=auth_headers_a,
        json={
            "category_id": 999999,
            "amount": 50.0,
            "type": "expense",
            "description": "Invalid category test",
            "date": str(date.today())
        }
    )
    assert response.status_code == 400
    assert "Invalid or inaccessible category" in response.json()["detail"]


def test_list_transactions_pagination(client, auth_headers_a):
    cats = client.get("/api/categories", headers=auth_headers_a).json()
    cat_id = cats[0]["id"]

    # Create 3 transactions
    for i in range(3):
        client.post(
            "/api/transactions",
            headers=auth_headers_a,
            json={
                "category_id": cat_id,
                "amount": 10.0 * (i + 1),
                "type": "expense",
                "description": f"Test Transaction {i}",
                "date": str(date.today())
            }
        )

    response = client.get("/api/transactions?page=1&size=2", headers=auth_headers_a)
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] >= 3
    assert data["total_pages"] >= 2


def test_update_and_delete_transaction(client, auth_headers_a):
    cats = client.get("/api/categories", headers=auth_headers_a).json()
    cat_id = cats[0]["id"]

    # Create transaction
    create_resp = client.post(
        "/api/transactions",
        headers=auth_headers_a,
        json={
            "category_id": cat_id,
            "amount": 42.0,
            "type": "expense",
            "description": "Original description",
            "date": str(date.today())
        }
    )
    txn_id = create_resp.json()["id"]

    # Update
    update_resp = client.put(
        f"/api/transactions/{txn_id}",
        headers=auth_headers_a,
        json={
            "amount": 50.0,
            "description": "Updated description"
        }
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["amount"] == 50.0
    assert update_resp.json()["description"] == "Updated description"

    # Delete
    del_resp = client.delete(f"/api/transactions/{txn_id}", headers=auth_headers_a)
    assert del_resp.status_code == 200

    # Verify not found
    get_resp = client.get(f"/api/transactions/{txn_id}", headers=auth_headers_a)
    assert get_resp.status_code == 404
