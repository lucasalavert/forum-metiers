# 1. Responsabilité : Tests d'intégration pour les API d'administration protégées par JWT et d'arbitrage
# 2. Dépendances clés : pytest, fastapi.testclient, backend.app.schemas.*
# 3. Mots-clés métier : admin_tests, jwt_guard, formations_api, students_api, allocations_run

import pytest


def test_admin_endpoints_reject_unauthenticated_access(client):
    # Les endpoints d'administration doivent rejeter tout appel sans jeton Bearer (401)
    assert client.get("/api/v1/students").status_code == 401
    assert client.post("/api/v1/students", json={}).status_code == 401
    assert client.get("/api/v1/students/class-configs").status_code == 401
    assert client.post("/api/v1/students/regenerate-all-tokens").status_code == 401
    assert client.get("/api/v1/allocations/analysis").status_code == 401
    assert client.post("/api/v1/allocations/run", json={}).status_code == 401
    assert client.put("/api/v1/allocations/assignments", json={}).status_code == 401
    assert client.post("/api/v1/formations", json={}).status_code == 401
    assert client.delete("/api/v1/formations/1").status_code == 401
    assert client.get("/api/v1/config/archive").status_code == 401
    assert client.post("/api/v1/config/purge", json={"purge_wishes": True}).status_code == 401


def test_formations_crud_and_allocation_run(client, admin_headers):
    payload = {
        "code": "TEST-01",
        "name": "Architecture et Urbanisme",
        "domain": "Architecture",
        "description": "Découverte des métiers de l'architecture.",
        "speaker_name": "M. Bâtisseur",
        "room": "Salle 10",
        "target_levels": "2NDE,1ERE,TERM",
        "capacity_per_rotation": 25,
        "active_rotations": "1,2,3,4",
    }
    create_resp = client.post("/api/v1/formations", json=payload, headers=admin_headers)
    assert create_resp.status_code == 201
    form_data = create_resp.json()
    assert form_data["code"] == "TEST-01"
    assert form_data["capacity_per_rotation"] == 25

    # Lister les formations (public pour le portail élève)
    list_resp = client.get("/api/v1/formations")
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] >= 1

    # Créer un élève (protégé par JWT)
    student_payload = {
        "first_name": "Alice",
        "last_name": "Martin",
        "class_name": "2nde 1",
        "level": "2NDE",
        "email": "alice.martin@test.org",
    }
    st_resp = client.post("/api/v1/students", json=student_payload, headers=admin_headers)
    assert st_resp.status_code == 201
    student_data = st_resp.json()
    assert student_data["token"].startswith("sp-")

    # Lancer le solveur (protégé par JWT)
    alloc_resp = client.post(
        "/api/v1/allocations/run",
        json={"auto_fill_missing": True, "respect_locks": True},
        headers=admin_headers,
    )
    assert alloc_resp.status_code == 200
    alloc_stats = alloc_resp.json()
    assert "satisfaction" in alloc_stats
    assert "tensions" in alloc_stats

    # Importer des vœux via CSV (protégé par JWT)
    wishes_csv = "email,nom,prenom,classe,wish_1\nalice.martin@test.org,MARTIN,Alice,2nde 1,TEST-01\n"
    wishes_resp = client.post(
        "/api/v1/students/import-wishes-csv",
        files={"file": ("wishes.csv", wishes_csv.encode("utf-8"), "text/csv")},
        headers=admin_headers,
    )
    assert wishes_resp.status_code == 200
    w_res = wishes_resp.json()
    assert w_res["success"] is True
    assert w_res["imported_count"] == 1
    assert w_res["updated_count"] == 1

    # Exporter l'archive annuelle ZIP
    arch_resp = client.get("/api/v1/config/archive", headers=admin_headers)
    assert arch_resp.status_code == 200
    assert arch_resp.headers["content-type"] == "application/zip"
    assert len(arch_resp.content) > 100

    # Purger les élèves et les vœux tout en conservant les formations
    purge_resp = client.post(
        "/api/v1/config/purge",
        json={"purge_wishes": True, "purge_students": True, "purge_formations": False},
        headers=admin_headers,
    )
    assert purge_resp.status_code == 200
    p_data = purge_resp.json()
    assert p_data["deleted_students"] == 1
    assert p_data["deleted_formations"] == 0
    assert client.get("/api/v1/formations").json()["total"] == 1
