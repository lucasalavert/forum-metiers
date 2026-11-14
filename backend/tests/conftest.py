# 1. Responsabilité : Fixtures Pytest partagées, base SQLite en mémoire, reset rate-limit et client HTTP
# 2. Dépendances clés : pytest, fastapi.testclient, sqlalchemy, backend.app.main, backend.app.core.*
# 3. Mots-clés métier : conftest, fixtures, test_client, admin_headers, in_memory_db, isolated_tests

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from backend.app.core.database import Base, get_db
from backend.app.core.rate_limit import reset_all_rate_limiters
from backend.app.core.security import create_access_token, generate_salt, hash_password
from backend.app.main import app
from backend.app.models.config import AdminUser

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    reset_all_rate_limiters()
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        reset_all_rate_limiters()


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def admin_headers(db_session) -> dict[str, str]:
    salt = generate_salt()
    pwd_hash = hash_password("TestAdmin2027!", salt)
    admin = AdminUser(
        username="test_fixture_admin",
        email="fixture_admin@test.org",
        password_hash=pwd_hash,
        salt=salt,
        full_name="Admin Fixture",
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    token = create_access_token(admin.id, admin.username)
    return {"Authorization": f"Bearer {token}"}
