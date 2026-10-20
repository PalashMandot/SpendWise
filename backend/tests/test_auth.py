def test_register_success(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "newuser@example.com",
            "full_name": "New User",
            "password": "securepassword123",
            "currency": "USD"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"
    assert "hashed_password" not in data


def test_register_duplicate_email(client, user_a):
    response = client.post(
        "/api/auth/register",
        json={
            "email": user_a.email,
            "full_name": "Duplicate User",
            "password": "securepassword123"
        }
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_register_short_password(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "shortpass@example.com",
            "full_name": "Short Password",
            "password": "123"
        }
    )
    assert response.status_code == 422  # Pydantic validation error


def test_login_success(client, user_a):
    response = client.post(
        "/api/auth/login",
        json={
            "email": user_a.email,
            "password": "password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_password(client, user_a):
    response = client.post(
        "/api/auth/login",
        json={
            "email": user_a.email,
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_login_nonexistent_user(client):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "password123"
        }
    )
    assert response.status_code == 401


def test_get_current_user_profile(client, auth_headers_a, user_a):
    response = client.get("/api/auth/me", headers=auth_headers_a)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == user_a.email
    assert data["full_name"] == user_a.full_name


def test_get_current_user_unauthorized(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
