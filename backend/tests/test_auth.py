from .conftest import add_device, login, make_client, register


def test_register_login_logout_cycle(client):
    c = make_client()
    r = c.post("/api/auth/register", json={"email": "A@Example.com", "full_name": "A", "password": "Passw0rdA1"})
    assert r.status_code == 201 and r.json()["email"] == "a@example.com" and r.json()["role"] == "user"
    assert "password" not in r.text
    assert c.get("/api/auth/me").status_code == 200
    assert c.post("/api/auth/logout").status_code == 204
    assert c.get("/api/auth/me").status_code == 401


def test_logout_revokes_stolen_token(client):
    c = make_client()
    register(c)
    token = c.cookies.get("access_token")
    c.post("/api/auth/logout")
    r = make_client().get("/api/devices", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401


def test_duplicate_email_and_weak_password(client):
    register(make_client())
    r = make_client().post("/api/auth/register", json={"email": "user1@example.com", "full_name": "X", "password": "Passw0rdA1"})
    assert r.status_code == 409
    r = make_client().post("/api/auth/register", json={"email": "n@example.com", "full_name": "X", "password": "short"})
    assert r.status_code == 422 and r.json()["code"] == "validation_error"
    r = make_client().post("/api/auth/register", json={"email": "n@example.com", "full_name": "X", "password": "onlyletters"})
    assert r.status_code == 422


def test_login_failures_are_generic(client):
    register(make_client())
    a = make_client().post("/api/auth/login", json={"email": "user1@example.com", "password": "wrongpass1"})
    b = make_client().post("/api/auth/login", json={"email": "nobody@example.com", "password": "wrongpass1"})
    assert a.status_code == b.status_code == 401 and a.json() == b.json()


def test_password_is_hashed(client):
    from backend.app.db import SessionLocal
    from backend.app.models import User
    register(make_client())
    with SessionLocal() as db:
        u = db.query(User).filter_by(email="user1@example.com").one()
        assert u.password_hash.startswith("$2") and "Passw0rdA1" not in u.password_hash


def test_protected_routes_need_auth(client):
    for path in ("/api/devices", "/api/predictions", "/api/dashboard", "/api/admin/datasets"):
        assert make_client().get(path).status_code == 401


def test_admin_routes_forbidden_for_users(user):
    assert user.get("/api/admin/datasets").status_code == 403
    assert user.post("/api/admin/devices", json={}).status_code == 403
    assert user.post("/api/admin/models/train", json={}).status_code == 403
    assert user.get("/api/admin/prediction-logs").status_code == 403


def test_error_responses_hide_internals(user):
    r = user.get("/api/devices/DOES-NOT-EXIST")
    assert r.status_code == 404 and "Traceback" not in r.text and r.json()["code"] == "device_not_found"
