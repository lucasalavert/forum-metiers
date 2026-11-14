# 1. Responsabilité : Tests d'intégration pour le portail élève, fermeture des vœux et anti-énumération
# 2. Dépendances clés : pytest, fastapi.testclient, backend.app.models.*
# 3. Mots-clés métier : portal_tests, wishes_validation, wishes_closed, anti_enumeration, token_lookup

from backend.app.models.allocation import Assignment
from backend.app.models.formation import Formation
from backend.app.models.student import ClassGroupConfig, Student


def test_portal_lookup_and_wishes_submission(client, db_session):
    f1 = Formation(code="F01", name="Santé", domain="Santé", target_levels="1ERE,TERM", capacity_per_rotation=20)
    f2 = Formation(code="F02", name="Ingénieur", domain="Sciences", target_levels="1ERE,TERM", capacity_per_rotation=20)
    f3 = Formation(code="F03", name="Droit", domain="Droit", target_levels="1ERE,TERM", capacity_per_rotation=20)
    f4 = Formation(code="F04", name="Commerce", domain="Eco", target_levels="1ERE,TERM", capacity_per_rotation=20)
    db_session.add_all([f1, f2, f3, f4])

    student = Student(
        token="sp-test-1ere",
        first_name="Jean",
        last_name="Dupont",
        class_name="1ère 1",
        level="1ERE",
    )
    db_session.add(student)
    db_session.commit()

    resp = client.get("/api/v1/portal/sp-test-1ere")
    assert resp.status_code == 200
    data = resp.json()
    assert data["first_name"] == "Jean"
    assert data["required_wishes_count"] == 6

    payload = {
        "wishes": [
            {"formation_id": f1.id, "rank": 1},
            {"formation_id": f2.id, "rank": 2},
            {"formation_id": f3.id, "rank": 3},
            {"formation_id": f4.id, "rank": 4},
        ]
    }
    submit_resp = client.put("/api/v1/portal/sp-test-1ere/wishes", json=payload)
    assert submit_resp.status_code == 200
    sub_data = submit_resp.json()
    assert len(sub_data["wishes"]) == 4
    assert sub_data["wishes"][0]["formation_id"] == f1.id


def test_portal_token_not_found_and_rate_limiting(client):
    # 15 tentatives sur des tokens inexistants -> 404
    for i in range(15):
        resp = client.get(f"/api/v1/portal/sp-invalid-guess-{i}")
        assert resp.status_code == 404

    # La 16e tentative depuis la même IP est bloquée en 429 Too Many Requests
    blocked_resp = client.get("/api/v1/portal/sp-invalid-guess-16")
    assert blocked_resp.status_code == 429
    assert blocked_resp.json()["error"] == "RATE_LIMIT_EXCEEDED"
    assert "Retry-After" in blocked_resp.headers


def test_wishes_submission_rejected_when_wishes_closed(client, db_session, admin_headers):
    f_list = [
        Formation(code=f"WC{i}", name=f"Form {i}", domain="D", target_levels="1ERE", capacity_per_rotation=20)
        for i in range(1, 5)
    ]
    st = Student(token="sp-closed-test", first_name="Léa", last_name="Moreau", class_name="1ère 2", level="1ERE")
    db_session.add_all([*f_list, st])
    db_session.commit()

    # L'admin ferme la collecte des vœux
    close_resp = client.put("/api/v1/config", json={"wishes_open": False}, headers=admin_headers)
    assert close_resp.status_code == 200
    assert close_resp.json()["wishes_open"] is False

    # Tentative de soumission -> 403 WISHES_CLOSED
    wishes_payload = {
        "wishes": [{"formation_id": f.id, "rank": idx} for idx, f in enumerate(f_list, start=1)]
    }
    sub_resp = client.put("/api/v1/portal/sp-closed-test/wishes", json=wishes_payload)
    assert sub_resp.status_code == 403
    assert sub_resp.json()["error"] == "WISHES_CLOSED"


def test_wishes_update_clears_old_assignments_and_reallocates(client, db_session, admin_headers):
    f_old = Formation(code="OLD", name="Ancienne", domain="D", target_levels="2NDE", capacity_per_rotation=20)
    f_new1 = Formation(code="N1", name="Nouveau 1", domain="D", target_levels="2NDE", capacity_per_rotation=20)
    f_new2 = Formation(code="N2", name="Nouveau 2", domain="D", target_levels="2NDE", capacity_per_rotation=20)
    f_new3 = Formation(code="N3", name="Nouveau 3", domain="D", target_levels="2NDE", capacity_per_rotation=20)
    f_new4 = Formation(code="N4", name="Nouveau 4", domain="D", target_levels="2NDE", capacity_per_rotation=20)
    cfg = ClassGroupConfig(class_name="2nde 1", level="2NDE", specialty_rotations="1,2")
    db_session.add_all([f_old, f_new1, f_new2, f_new3, f_new4, cfg])

    student = Student(
        token="sp-test-2nde",
        first_name="Camille",
        last_name="Bernard",
        class_name="2nde 1",
        level="2NDE",
    )
    db_session.add(student)
    db_session.commit()

    old_assign = Assignment(
        student_id=student.id,
        rotation=1,
        assignment_type="FORMATION",
        formation_id=f_old.id,
        is_locked=True,
    )
    db_session.add(old_assign)
    db_session.commit()

    new_wishes_payload = {
        "wishes": [
            {"formation_id": f_new1.id, "rank": 1},
            {"formation_id": f_new2.id, "rank": 2},
            {"formation_id": f_new3.id, "rank": 3},
            {"formation_id": f_new4.id, "rank": 4},
        ]
    }
    submit_resp = client.put("/api/v1/portal/sp-test-2nde/wishes", json=new_wishes_payload)
    assert submit_resp.status_code == 200

    remaining_assigns = db_session.query(Assignment).filter(Assignment.student_id == student.id).all()
    assert len(remaining_assigns) == 0

    run_resp = client.post(
        "/api/v1/allocations/run",
        json={"respect_locks": True, "auto_fill_missing": True},
        headers=admin_headers,
    )
    assert run_resp.status_code == 200

    portal_resp = client.get("/api/v1/portal/sp-test-2nde")
    assert portal_resp.status_code == 200
    assignments = portal_resp.json()["assignments"]
    assert len(assignments) == 4

    assigned_rots = {a["rotation"]: a for a in assignments}
    assert assigned_rots[1]["assignment_type"] == "SPECIALTY"
    assert assigned_rots[2]["assignment_type"] == "SPECIALTY"
    assert assigned_rots[3]["assignment_type"] == "FORMATION"
    assert assigned_rots[4]["assignment_type"] == "FORMATION"
    assert assigned_rots[3]["formation_id"] != f_old.id
    assert assigned_rots[4]["formation_id"] != f_old.id


def test_student_token_regeneration_and_pending_allocation_kpi(client, db_session, admin_headers):
    from backend.app.core.security import generate_student_token

    t1 = generate_student_token("cle-test", deterministic=True)
    t2 = generate_student_token("cle-test", deterministic=True)
    assert t1 == t2
    assert t1.startswith("sp-")
    assert len(t1) == 23

    t_random1 = generate_student_token("cle-test", deterministic=False)
    t_random2 = generate_student_token("cle-test", deterministic=False)
    assert t_random1 != t_random2

    s = Student(
        token="sp-old-token-123",
        first_name="Lucas",
        last_name="Martin",
        class_name="Term 1",
        level="TERM",
    )
    db_session.add(s)
    db_session.commit()

    regen_resp = client.post(f"/api/v1/students/{s.id}/regenerate-token", headers=admin_headers)
    assert regen_resp.status_code == 200
    new_token = regen_resp.json()["token"]
    assert new_token != "sp-old-token-123"
    assert new_token.startswith("sp-")

    regen_all_resp = client.post("/api/v1/students/regenerate-all-tokens", headers=admin_headers)
    assert regen_all_resp.status_code == 200
    assert regen_all_resp.json()["updated_count"] >= 1

    db_session.refresh(s)
    active_token = s.token

    f_list = [
        Formation(code=f"KP{i}", name=f"Form {i}", domain="D", target_levels="TERM", capacity_per_rotation=20)
        for i in range(1, 5)
    ]
    db_session.add_all(f_list)
    db_session.commit()

    wishes_payload = {
        "wishes": [{"formation_id": f.id, "rank": idx} for idx, f in enumerate(f_list, start=1)]
    }
    submit_res = client.put(f"/api/v1/portal/{active_token}/wishes", json=wishes_payload)
    assert submit_res.status_code == 200

    stats_before = client.get("/api/v1/allocations/analysis", headers=admin_headers).json()
    assert stats_before["students_pending_allocation"] >= 1
    assert stats_before["unassigned_wishes_total"] >= 4

    client.post(
        "/api/v1/allocations/run",
        json={"respect_locks": True, "auto_fill_missing": True},
        headers=admin_headers,
    )
    stats_after = client.get("/api/v1/allocations/analysis", headers=admin_headers).json()
    assert stats_after["students_pending_allocation"] == 0
    assert stats_after["unassigned_wishes_total"] == 0
