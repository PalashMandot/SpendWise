import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.services.auth_service import get_password_hash, create_access_token
from app.services.seed_service import seed_default_categories

# In-memory SQLite for high-speed, isolated unit tests
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_default_categories(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session() -> Generator:
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session) -> Generator:
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def user_a(db_session) -> User:
    user = User(
        email="alice@example.com",
        full_name="Alice Adams",
        hashed_password=get_password_hash("password123"),
        currency="USD",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def token_a(user_a) -> str:
    return create_access_token(subject=user_a.id)


@pytest.fixture
def auth_headers_a(token_a) -> dict:
    return {"Authorization": f"Bearer {token_a}"}


@pytest.fixture
def user_b(db_session) -> User:
    user = User(
        email="bob@example.com",
        full_name="Bob Builder",
        hashed_password=get_password_hash("password123"),
        currency="USD",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def token_b(user_b) -> str:
    return create_access_token(subject=user_b.id)


@pytest.fixture
def auth_headers_b(token_b) -> dict:
    return {"Authorization": f"Bearer {token_b}"}
