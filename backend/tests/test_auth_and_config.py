# 1. Responsabilité : Tests d'intégration pour l'authentification admin, anti-bruteforce et configuration globale
# 2. Dépendances clés : pytest, fastapi.testclient, backend.app.models.config
# 3. Mots-clés métier : auth_test, anti_bruteforce, config_test, dynamic_rotations, white_label

import pytest
from backend.app.core.security import generate_salt, hash_password
from backend.app.models.config import AdminUser
from backend.app.schemas.auth import LoginRequest


def test_admin_login_success_and_failure(client, db_session):
    salt = generate_salt()
    pwd_hash = hash_password("SuperSecret2027!", salt)
    admin = AdminUser(
        username="superadmin",
        email="superadmin@etablissement.fr",
        password_hash=pwd_hash,
        salt=salt,
        full_name="Super Admin",
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()

    fail_resp = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "superadmin@etablissement.fr", "password": "WrongPassword"},
    )
    assert fail_resp.status_code == 401

    success_resp = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "superadmin@etablissement.fr", "password": "SuperSecret2027!"},
    )
    assert success_resp.status_code == 200
    token = success_resp.json()["access_token"]

    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["username"] == "superadmin"


def test_admin_login_anti_bruteforce_rate_limit(client, db_session):
    salt = generate_salt()
    pwd_hash = hash_password("ValidPass2027!", salt)
    db_session.add(
        AdminUser(
            username="targetadmin",
            email="target@etablissement.fr",
            password_hash=pwd_hash,
            salt=salt,
            full_name="Target Admin",
            is_active=True,
        )
    )
    db_session.commit()

    # 5 échecs consécutifs -> 401
    for _ in range(5):
        r = client.post(
            "/api/v1/auth/login",
            json={"username_or_email": "targetadmin", "password": "BadPassword"},
        )
        assert r.status_code == 401

    # 6e tentative (même avec le bon mot de passe) -> bloquée 429 Too Many Requests
    blocked = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "targetadmin", "password": "ValidPass2027!"},
    )
    assert blocked.status_code == 429
    assert blocked.json()["error"] == "RATE_LIMIT_EXCEEDED"
    assert "Retry-After" in blocked.headers


def test_event_config_read_and_protected_update_with_dynamic_rotations(client, admin_headers):
    resp = client.get("/api/v1/config")
    assert resp.status_code == 200
    data = resp.json()
    assert data["event_date"] == "2027-01-20"
    assert data["rotations_count"] == 4
    assert data["seconde_specialty_slots"] == 2
    assert len(data["rotations"]) == 4

    # Modification sans jeton -> 401
    unauth_resp = client.put("/api/v1/config", json={"event_title": "Nouveau Titre"})
    assert unauth_resp.status_code == 401

    # Passage à 5 rotations et 0 créneau spécialité pour les 2ndes
    update_payload = {
        "event_date": "2027-01-27",
        "event_date_label": "Mercredi 27 janvier 2027",
        "rotations_count": 5,
        "seconde_specialty_slots": 0,
        "r1_start": "08:45",
        "r1_end": "09:35",
        "r5_start": "14:00",
        "r5_end": "14:50",
    }
    update_resp = client.put("/api/v1/config", json=update_payload, headers=admin_headers)
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["rotations_count"] == 5
    assert updated_data["seconde_specialty_slots"] == 0
    assert len(updated_data["rotations"]) == 5
    assert updated_data["rotations"][4]["rotation"] == 5
    assert updated_data["rotations"][4]["start_time"] == "14:00"


def test_admin_user_crud_and_guards(client, db_session):
    salt = generate_salt()
    pwd_hash = hash_password("AdminPass1!", salt)
    admin = AdminUser(
        username="leadadmin",
        email="lead@etablissement.fr",
        password_hash=pwd_hash,
        salt=salt,
        full_name="Lead Admin",
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "leadadmin", "password": "AdminPass1!"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    create_resp = client.post(
        "/api/v1/auth/users",
        json={
            "username": "cpe_morel",
            "email": "cpe@etablissement.fr",
            "full_name": "Claire Morel (CPE)",
            "password": "PasswordCPE2027!",
        },
        headers=headers,
    )
    assert create_resp.status_code == 201
    cpe_id = create_resp.json()["id"]

    list_resp = client.get("/api/v1/auth/users", headers=headers)
    assert list_resp.status_code == 200
    assert any(u["username"] == "cpe_morel" for u in list_resp.json())

    self_del = client.delete(f"/api/v1/auth/users/{admin.id}", headers=headers)
    assert self_del.status_code == 400
    assert self_del.json()["error"] == "CANNOT_DELETE_SELF"

    self_deact = client.put(f"/api/v1/auth/users/{admin.id}", json={"is_active": False}, headers=headers)
    assert self_deact.status_code == 400
    assert self_deact.json()["error"] == "CANNOT_DEACTIVATE_SELF"

    del_resp = client.delete(f"/api/v1/auth/users/{cpe_id}", headers=headers)
    assert del_resp.status_code == 204


def test_ensure_default_admin_and_password_sync(db_session, monkeypatch):
    from backend.app.core.config import get_settings
    from backend.app.repositories.admin_user_repo import AdminUserRepository
    from backend.app.services.auth_service import AuthService

    get_settings.cache_clear()
    monkeypatch.setenv("ADMIN_PASSWORD", "CustomPortainerPwd2027!")
    monkeypatch.setenv("ADMIN_USERNAME", "custom_admin")
    monkeypatch.setenv("ADMIN_EMAIL", "custom_admin@etablissement.fr")

    service = AuthService(AdminUserRepository(db_session))
    admin = service.ensure_default_admin()
    assert admin.username == "custom_admin"

    login_res = service.login(
        LoginRequest(username_or_email="custom_admin", password="CustomPortainerPwd2027!")
    )
    assert login_res.access_token is not None

    get_settings.cache_clear()
    monkeypatch.setenv("ADMIN_PASSWORD", "BrandNewPassword2028!")
    admin_updated = service.ensure_default_admin()
    assert admin_updated.id == admin.id

    with pytest.raises(Exception):
        service.login(
            LoginRequest(username_or_email="custom_admin", password="CustomPortainerPwd2027!")
        )

    login_res2 = service.login(
        LoginRequest(username_or_email="custom_admin", password="BrandNewPassword2028!")
    )
    assert login_res2.access_token is not None


def test_white_label_branding_config_and_migration(client, admin_headers):
    from sqlalchemy import create_engine, inspect, text
    from backend.app.core.database import ensure_schema_migrations

    default_resp = client.get("/api/v1/config")
    assert default_resp.status_code == 200
    default_data = default_resp.json()
    assert default_data["school_name"] == "Lycée Général et Technologique"
    assert default_data["school_logo_url"] == ""

    bad_logo_resp = client.put(
        "/api/v1/config",
        json={"school_logo_url": "javascript:alert(1)"},
        headers=admin_headers,
    )
    assert bad_logo_resp.status_code == 400
    assert bad_logo_resp.json()["error"] == "INVALID_LOGO_URL"

    bad_color_resp = client.put(
        "/api/v1/config",
        json={"theme_primary_color": "not-a-color"},
        headers=admin_headers,
    )
    assert bad_color_resp.status_code == 400
    assert bad_color_resp.json()["error"] == "INVALID_THEME_COLOR"

    custom_svg_uri = "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="
    ok_resp = client.put(
        "/api/v1/config",
        json={
            "school_name": "Lycée Victor Hugo",
            "school_subtitle": "Académie",
            "ent_name": "Pronote",
            "school_website_url": "https://hugo.example.fr",
            "school_logo_url": custom_svg_uri,
            "home_access_instructions": "Étape 1 : Ouvrez votre messagerie.\nÉtape 2 : Cliquez sur le lien.",
            "theme_primary_color": "#0F172A",
            "theme_secondary_color": "#1E3A8A",
            "theme_accent_color": "#D97706",
        },
        headers=admin_headers,
    )
    assert ok_resp.status_code == 200
    updated = ok_resp.json()
    assert updated["school_name"] == "Lycée Victor Hugo"
    assert updated["school_logo_url"] == custom_svg_uri
    assert "Étape 1" in updated["home_access_instructions"]
    assert updated["theme_primary_color"] == "#0F172A"
    assert updated["theme_secondary_color"] == "#1E3A8A"
    assert updated["theme_accent_color"] == "#D97706"

    legacy_engine = create_engine("sqlite:///:memory:")
    with legacy_engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE event_config (
                    id INTEGER PRIMARY KEY,
                    event_title VARCHAR(200) NOT NULL,
                    event_date VARCHAR(50) NOT NULL,
                    event_date_label VARCHAR(100) NOT NULL,
                    location VARCHAR(200) NOT NULL
                )
                """
            )
        )
        conn.execute(
            text(
                "INSERT INTO event_config (id, event_title, event_date, event_date_label, location) "
                "VALUES (1, 'Forum Test', '2027-02-01', '1er février', 'Lycée Test')"
            )
        )

    ensure_schema_migrations(legacy_engine)
    ensure_schema_migrations(legacy_engine)

    cols = {c["name"] for c in inspect(legacy_engine).get_columns("event_config")}
    assert {
        "school_name",
        "rotations_count",
        "seconde_specialty_slots",
        "r5_start",
        "r6_end",
        "home_access_instructions",
        "theme_primary_color",
        "theme_secondary_color",
        "theme_accent_color",
    }.issubset(cols)
