from datetime import date, timedelta


def test_create_and_process_recurring_transaction(client, auth_headers_a):
    cats = client.get("/api/categories", headers=auth_headers_a).json()
    cat_id = cats[0]["id"]
    past_due_date = str(date.today() - timedelta(days=2))

    # Create recurring rule with past due date
    create_resp = client.post(
        "/api/recurring",
        headers=auth_headers_a,
        json={
            "category_id": cat_id,
            "amount": 15.99,
            "type": "expense",
            "description": "Streaming Media Subscription",
            "frequency": "monthly",
            "start_date": past_due_date,
            "payment_method": "credit_card"
        }
    )
    assert create_resp.status_code == 201
    rule_data = create_resp.json()
    assert rule_data["amount"] == 15.99

    # Trigger process due rules
    process_resp = client.post("/api/recurring/process-due", headers=auth_headers_a)
    assert process_resp.status_code == 200
    process_json = process_resp.json()
    assert process_json["processed_count"] >= 1
    generated_descriptions = [t["description"] for t in process_json["generated_transactions"]]
    assert any("Streaming Media Subscription (Recurring)" in desc for desc in generated_descriptions)
