# 1. Responsabilité : Tests unitaires de l'algorithme d'optimisation (quotas, spécialités et N rotations dynamiques)
# 2. Dépendances clés : pytest, backend.app.services.solver_engine
# 3. Mots-clés métier : solver_test, capacity_constraint, dynamic_rotations, specialties_constraint, unit_test

from backend.app.services.solver_engine import (
    FormationInput,
    SolvedAssignment,
    SolverEngine,
    StudentInput,
)


def test_solver_capacity_not_exceeded():
    formations = {
        1: FormationInput(id=1, code="F1", name="Form 1", domain="D1", target_levels={"1ERE"}, capacity_per_rotation=2),
        2: FormationInput(id=2, code="F2", name="Form 2", domain="D2", target_levels={"1ERE"}, capacity_per_rotation=2),
    }
    students = {
        i: StudentInput(id=i, level="1ERE", class_name="1ère 1", wishes=[(1, 1), (2, 2)])
        for i in range(1, 11)
    }

    engine = SolverEngine(
        formations=formations,
        students=students,
        class_configs={},
        locked_assignments=[],
        auto_fill_missing=False,
    )
    results = engine.solve()

    occupancy_f1 = {r: 0 for r in range(1, 5)}
    for res in results:
        if res.formation_id == 1:
            occupancy_f1[res.rotation] += 1

    for rot, occ in occupancy_f1.items():
        assert occ <= 2, f"Rotation {rot} a dépassé la capacité : {occ} > 2"


def test_solver_seconde_specialty_rotations():
    formations = {
        1: FormationInput(id=1, code="F1", name="Form 1", domain="D1", target_levels={"2NDE"}, capacity_per_rotation=10),
        2: FormationInput(id=2, code="F2", name="Form 2", domain="D2", target_levels={"2NDE"}, capacity_per_rotation=10),
        3: FormationInput(id=3, code="F3", name="Form 3", domain="D3", target_levels={"2NDE"}, capacity_per_rotation=10),
    }
    students = {
        1: StudentInput(id=1, level="2NDE", class_name="2nde A", wishes=[(1, 1), (2, 2), (3, 3)]),
    }
    class_configs = {"2nde A": "1,2"}

    engine = SolverEngine(
        formations=formations,
        students=students,
        class_configs=class_configs,
        locked_assignments=[],
        auto_fill_missing=False,
    )
    results = engine.solve()

    assignments_by_rot = {r.rotation: r for r in results}
    assert len(assignments_by_rot) == 4
    assert assignments_by_rot[1].assignment_type == "SPECIALTY"
    assert assignments_by_rot[2].assignment_type == "SPECIALTY"
    assert assignments_by_rot[3].assignment_type == "FORMATION"
    assert assignments_by_rot[4].assignment_type == "FORMATION"


def test_solver_respect_locked_assignments():
    formations = {
        1: FormationInput(id=1, code="F1", name="Form 1", domain="D1", target_levels={"1ERE"}, capacity_per_rotation=5),
        2: FormationInput(id=2, code="F2", name="Form 2", domain="D2", target_levels={"1ERE"}, capacity_per_rotation=5),
    }
    students = {
        1: StudentInput(id=1, level="1ERE", class_name="1ère 1", wishes=[(1, 1)]),
    }
    locked = [
        SolvedAssignment(
            student_id=1,
            rotation=3,
            assignment_type="FORMATION",
            formation_id=2,
            wish_rank_obtained=None,
            is_locked=True,
        )
    ]

    engine = SolverEngine(
        formations=formations,
        students=students,
        class_configs={},
        locked_assignments=locked,
        auto_fill_missing=False,
    )
    results = engine.solve()

    rot3 = next(r for r in results if r.rotation == 3)
    assert rot3.formation_id == 2
    assert rot3.is_locked is True


def test_solver_dynamic_rotations_and_zero_specialty_slots():
    # Forum à 5 rotations avec 0 créneau spécialité pour les Secondes
    formations = {
        i: FormationInput(
            id=i,
            code=f"F{i}",
            name=f"Form {i}",
            domain="D",
            target_levels={"2NDE", "1ERE"},
            capacity_per_rotation=10,
            active_rotations={1, 2, 3, 4, 5},
        )
        for i in range(1, 7)
    }
    students = {
        1: StudentInput(
            id=1,
            level="2NDE",
            class_name="2nde Libre",
            wishes=[(1, 1), (2, 2), (3, 3), (4, 4), (5, 5)],
        ),
    }

    engine = SolverEngine(
        formations=formations,
        students=students,
        class_configs={"2nde Libre": "AUTO"},
        locked_assignments=[],
        auto_fill_missing=True,
        rotations_count=5,
        seconde_specialty_slots=0,
    )
    results = engine.solve()
    assert len(results) == 5
    assert all(r.assignment_type == "FORMATION" for r in results)
    assert {r.rotation for r in results} == {1, 2, 3, 4, 5}


def test_solver_three_rotations_with_one_specialty_slot():
    # Forum à 3 rotations avec 1 seul créneau spécialité pour les Secondes
    formations = {
        i: FormationInput(
            id=i,
            code=f"F{i}",
            name=f"Form {i}",
            domain="D",
            target_levels={"2NDE"},
            capacity_per_rotation=10,
            active_rotations={1, 2, 3},
        )
        for i in range(1, 5)
    }
    students = {
        1: StudentInput(
            id=1,
            level="2NDE",
            class_name="2nde B",
            wishes=[(1, 1), (2, 2), (3, 3)],
        ),
    }

    engine = SolverEngine(
        formations=formations,
        students=students,
        class_configs={"2nde B": "AUTO"},
        locked_assignments=[],
        auto_fill_missing=True,
        rotations_count=3,
        seconde_specialty_slots=1,
    )
    results = engine.solve()
    assert len(results) == 3
    spec_count = sum(1 for r in results if r.assignment_type == "SPECIALTY")
    form_count = sum(1 for r in results if r.assignment_type == "FORMATION")
    assert spec_count == 1
    assert form_count == 2
