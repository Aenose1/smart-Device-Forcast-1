import os
import tempfile
from pathlib import Path

_tmp = tempfile.mkdtemp(prefix="sdf_tests_")
os.environ.update({
    "DATABASE_URL": f"sqlite:///{_tmp}/test.db",
    "JWT_SECRET": "test-secret-test-secret-test-secret-1234567890",
    "RATE_LIMIT_ENABLED": "false",
    "MODELS_DIR": f"{_tmp}/models",
    "UPLOADS_DIR": f"{_tmp}/uploads",
    "ADMIN_EMAIL": "admin@example.com",
    "ADMIN_PASSWORD": "AdminPass123",
    "SERVE_FRONTEND": "false",
    # tests must not depend on the developer's .env
    "SEED_SAMPLE_DATA": "false",
    "COOKIE_SECURE": "false",
    "MAX_UPLOAD_MB": "10",
    "MAX_FORECAST_YEARS": "5",
    "SAMPLE_DIR": "data/sample",
})

import math  # noqa: E402
from datetime import date  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from backend.app.db import Base, SessionLocal, engine  # noqa: E402
from backend.app.main import app  # noqa: E402
from backend.app.models import Device, DeviceSpec, PriceHistory  # noqa: E402
from backend.app.services import seed  # noqa: E402


def month(d: date, n: int) -> date:
    m = d.month - 1 + n
    return date(d.year + m // 12, m % 12 + 1, 1)


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed.ensure_admin(db)
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def make_client() -> TestClient:
    return TestClient(app)


def login(c: TestClient, email: str, password: str):
    r = c.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return c


@pytest.fixture
def admin(client):
    return login(make_client(), "admin@example.com", "AdminPass123")


def register(c: TestClient, email="user1@example.com", password="Passw0rdA1"):
    r = c.post("/api/auth/register", json={"email": email, "full_name": "Test User", "password": password})
    assert r.status_code == 201, r.text
    return c


@pytest.fixture
def user(client):
    return register(make_client())


@pytest.fixture
def user2(client):
    return register(make_client(), "user2@example.com")


def add_device(did="LP001", name="Test Laptop X", category="Laptop", months=24, decay=0.015, launch=100000.0, brand="Acme", sample=False):
    """Test fixture data only (deterministic synthetic series)."""
    with SessionLocal() as db:
        d = Device(id=did, name=name, brand=brand, category=category, release_date=date(2024, 1, 1),
                   launch_price=launch, currency="INR", status="Active")
        d.specs.extend([DeviceSpec(key="RAM", value="16 GB"), DeviceSpec(key="Storage", value="512 GB")])
        db.add(d)
        for i in range(months):
            wobble = 1 + 0.01 * math.sin(i * 1.7)
            db.add(PriceHistory(device_id=did, date=month(date(2024, 2, 1), i), price=round(launch * math.exp(-decay * (i + 1)) * wobble, 2),
                                source="unit-test", currency="INR", is_sample=sample))
        db.commit()
