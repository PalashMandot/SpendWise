def test_list_and_protect_system_categories(client, auth_headers_a):
    cats = client.get("/api/categories", headers=auth_headers_a).json()
    assert len(cats) >= 5
    system_cat = next(c for c in cats if c["is_system"])
    
    # Attempt to delete system category
    del_resp = client.delete(f"/api/categories/{system_cat['id']}", headers=auth_headers_a)
    assert del_resp.status_code == 403

    # Attempt to modify system category
    put_resp = client.put(f"/api/categories/{system_cat['id']}", headers=auth_headers_a, json={"name": "Hacked"})
    assert put_resp.status_code == 403


def test_custom_category_crud(client, auth_headers_a):
    create_resp = client.post(
        "/api/categories",
        headers=auth_headers_a,
        json={
            "name": "Mechanical Keyboards",
            "type": "expense",
            "color": "#8B5CF6",
            "icon": "keyboard"
        }
    )
    assert create_resp.status_code == 201
    cat_id = create_resp.json()["id"]
    assert create_resp.json()["name"] == "Mechanical Keyboards"

    # Update
    update_resp = client.put(
        f"/api/categories/{cat_id}",
        headers=auth_headers_a,
        json={"name": "Keyboards & Switches"}
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Keyboards & Switches"

    # Delete
    del_resp = client.delete(f"/api/categories/{cat_id}", headers=auth_headers_a)
    assert del_resp.status_code == 200
