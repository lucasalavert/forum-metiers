# 1. Responsabilité : Orchestration du solveur, calcul des KPIs de tension et satisfaction, arbitrages manuels
# 2. Dépendances clés : backend.app.repositories.*, backend.app.services.solver_engine, typing
# 3. Mots-clés métier : allocation, solver, tension, satisfaction, arbitrage, manual_override, stats

from typing import Dict, List
from backend.app.core.exceptions import EntityNotFoundError, ForbiddenOperationError, InvalidWishesError
from backend.app.models.student import Student
from backend.app.repositories.allocation_repo import AllocationRepository
from backend.app.repositories.config_repo import ConfigRepository
from backend.app.repositories.formation_repo import FormationRepository
from backend.app.repositories.student_repo import StudentRepository
from backend.app.schemas.allocation import (
    AllocationRunRequest,
    AllocationStatsResponse,
    AssignmentManualUpdateRequest,
    FormationTensionItem,
    SatisfactionBreakdown,
)
from backend.app.schemas.student import AssignmentBriefResponse
from backend.app.schemas.wish import WishSubmitRequest
from backend.app.services.config_service import compute_student_rotation_rules
from backend.app.services.solver_engine import FormationInput, SolvedAssignment, SolverEngine, StudentInput


class AllocationService:
    def __init__(
        self,
        allocation_repo: AllocationRepository,
        formation_repo: FormationRepository,
        student_repo: StudentRepository,
    ) -> None:
        self.alloc_repo = allocation_repo
        self.formation_repo = formation_repo
        self.student_repo = student_repo

    def submit_student_wishes(self, token: str, req: WishSubmitRequest) -> Student:
        event_cfg = ConfigRepository(self.student_repo.db).get_or_create_config()
        if not event_cfg.wishes_open:
            raise ForbiddenOperationError(
                "La période de saisie des vœux est actuellement fermée par l'établissement.",
                code="WISHES_CLOSED",
            )

        student = self.student_repo.get_by_token(token)
        if not student:
            raise EntityNotFoundError("StudentPortal", token)

        rot_count = getattr(event_cfg, "rotations_count", 4) or 4
        spec_slots_cfg = getattr(event_cfg, "seconde_specialty_slots", 2)
        class_cfg = self.student_repo.get_class_config(student.class_name)
        class_mode = class_cfg.specialty_rotations if class_cfg else "AUTO"
        _, _, expected_min, expected_max = compute_student_rotation_rules(
            student.level, class_mode, rot_count, spec_slots_cfg
        )

        seen_fids = set()
        wish_tuples: List[tuple[int, int]] = []
        for idx, item in enumerate(req.wishes, start=1):
            if item.formation_id in seen_fids:
                raise InvalidWishesError(f"Formation #{item.formation_id} sélectionnée plusieurs fois.")
            seen_fids.add(item.formation_id)

            f = self.formation_repo.get_by_id(item.formation_id)
            if not f:
                raise InvalidWishesError(f"Formation #{item.formation_id} inconnue.")
            if not f.is_open_to_level(student.level):
                raise InvalidWishesError(f"La formation '{f.name}' n'est pas ouverte au niveau {student.level}.")
            wish_tuples.append((item.formation_id, idx))

        if len(wish_tuples) < expected_min or len(wish_tuples) > expected_max:
            raise InvalidWishesError(
                f"Vous devez soumettre entre {expected_min} et {expected_max} vœux (reçus : {len(wish_tuples)})."
            )

        self.alloc_repo.save_student_wishes(student, wish_tuples)
        return student

    def run_allocation(self, req: AllocationRunRequest) -> AllocationStatsResponse:
        event_cfg = ConfigRepository(self.student_repo.db).get_or_create_config()
        rot_count = max(2, min(6, getattr(event_cfg, "rotations_count", 4) or 4))
        spec_slots = max(0, min(rot_count - 1, getattr(event_cfg, "seconde_specialty_slots", 2)))
        valid_rotations = set(range(1, rot_count + 1))

        all_formations = self.formation_repo.list_all()
        all_students = self.student_repo.list_all()
        class_configs_map = {
            cfg.class_name: cfg.specialty_rotations for cfg in self.student_repo.list_class_configs()
        }

        formation_inputs: Dict[int, FormationInput] = {}
        for f in all_formations:
            levels = {lvl.strip().upper() for lvl in f.target_levels.split(",") if lvl.strip()}
            raw_rots = {int(r.strip()) for r in f.active_rotations.split(",") if r.strip().isdigit()}
            if f.active_rotations.strip() == "1,2,3,4" and rot_count > 4:
                active_rots = set(valid_rotations)
            else:
                active_rots = (raw_rots & valid_rotations) or set(valid_rotations)

            formation_inputs[f.id] = FormationInput(
                id=f.id,
                code=f.code,
                name=f.name,
                domain=f.domain,
                target_levels=levels,
                capacity_per_rotation=f.capacity_per_rotation,
                active_rotations=active_rots,
            )

        student_inputs = {
            s.id: StudentInput(
                id=s.id,
                level=s.level,
                class_name=s.class_name,
                wishes=[(w.formation_id, w.rank) for w in s.wishes],
            )
            for s in all_students
        }

        locked_solved: List[SolvedAssignment] = []
        if req.respect_locks:
            for a in self.alloc_repo.list_all_assignments():
                if not a.is_locked or a.rotation > rot_count:
                    continue
                s_in = student_inputs.get(a.student_id)
                if not s_in:
                    continue
                if s_in.level.upper() == "2NDE" and a.assignment_type == "FORMATION" and spec_slots > 0:
                    spec_cfg = class_configs_map.get(s_in.class_name, "AUTO").strip().upper()
                    if spec_cfg not in ("AUTO", "NONE"):
                        spec_rots = {int(r) for r in spec_cfg.split(",") if r.strip().isdigit()}
                        if a.rotation in spec_rots:
                            continue
                if s_in.wishes and a.assignment_type == "FORMATION":
                    if a.formation_id not in {fid for fid, _ in s_in.wishes}:
                        continue
                locked_solved.append(
                    SolvedAssignment(
                        student_id=a.student_id,
                        rotation=a.rotation,
                        assignment_type=a.assignment_type,
                        formation_id=a.formation_id,
                        wish_rank_obtained=a.wish_rank_obtained,
                        is_locked=True,
                    )
                )
            self.alloc_repo.clear_unlocked_assignments()
        else:
            self.alloc_repo.clear_all_assignments()

        engine = SolverEngine(
            formations=formation_inputs,
            students=student_inputs,
            class_configs=class_configs_map,
            locked_assignments=locked_solved,
            auto_fill_missing=req.auto_fill_missing,
            rotations_count=rot_count,
            seconde_specialty_slots=spec_slots,
        )
        self.alloc_repo.save_all_assignments(engine.solve())
        return self.get_stats()

    def update_assignment_manual(self, req: AssignmentManualUpdateRequest) -> AssignmentBriefResponse:
        student = self.student_repo.get_by_id(req.student_id)
        if not student:
            raise EntityNotFoundError("Student", req.student_id)

        wish_rank = None
        if req.assignment_type == "FORMATION" and req.formation_id:
            if not self.formation_repo.get_by_id(req.formation_id):
                raise EntityNotFoundError("Formation", req.formation_id)
            matching_wish = next((w for w in student.wishes if w.formation_id == req.formation_id), None)
            if matching_wish:
                wish_rank = matching_wish.rank

        updated = self.alloc_repo.upsert_assignment(
            student_id=req.student_id,
            rotation=req.rotation,
            assignment_type=req.assignment_type,
            formation_id=req.formation_id if req.assignment_type == "FORMATION" else None,
            wish_rank_obtained=wish_rank,
            is_locked=req.is_locked,
        )

        f_name = updated.formation.name if updated.formation else None
        f_room = updated.formation.room if updated.formation else None
        spk = updated.formation.speaker_name if updated.formation else None
        if updated.assignment_type == "SPECIALTY":
            f_name = "Présentation des Enseignements de Spécialité"
            f_room = "Amphithéâtre / Salles dédiées"
            spk = "Équipe pédagogique de l'établissement"

        return AssignmentBriefResponse(
            rotation=updated.rotation,
            assignment_type=updated.assignment_type,
            formation_id=updated.formation_id,
            formation_name=f_name,
            formation_room=f_room,
            speaker_name=spk,
            wish_rank_obtained=updated.wish_rank_obtained,
            is_locked=updated.is_locked,
        )

    def get_stats(self) -> AllocationStatsResponse:
        event_cfg = ConfigRepository(self.student_repo.db).get_or_create_config()
        rot_count = max(2, min(6, getattr(event_cfg, "rotations_count", 4) or 4))

        all_students = self.student_repo.list_all()
        all_formations = self.formation_repo.list_all()
        all_assignments = [a for a in self.alloc_repo.list_all_assignments() if 1 <= a.rotation <= rot_count]
        wishes_map = self.formation_repo.get_wishes_counts()
        occupancy_map = self.formation_repo.get_occupancy_per_rotation()

        total_students = len(all_students)
        students_with_wishes = sum(1 for s in all_students if s.wishes_submitted_at is not None)
        students_pending, students_allocated, unassigned_wishes = 0, 0, 0
        for s in all_students:
            if s.wishes_submitted_at is not None:
                assigned_rots = sum(1 for a in s.assignments if 1 <= a.rotation <= rot_count)
                if assigned_rots < rot_count:
                    students_pending += 1
                    unassigned_wishes += (rot_count - assigned_rots)
                else:
                    students_allocated += 1

        total_capacity = sum(f.capacity_per_rotation * rot_count for f in all_formations)
        total_assigned_seats = sum(1 for a in all_assignments if a.assignment_type == "FORMATION")

        sb = SatisfactionBreakdown()
        for a in all_assignments:
            sb.total_assignments += 1
            if a.assignment_type == "SPECIALTY":
                sb.specialty_count += 1
            elif a.wish_rank_obtained == 1:
                sb.rank_1_count += 1
            elif a.wish_rank_obtained == 2:
                sb.rank_2_count += 1
            elif a.wish_rank_obtained == 3:
                sb.rank_3_count += 1
            elif a.wish_rank_obtained and a.wish_rank_obtained >= 4:
                sb.rank_4_plus_count += 1
            else:
                sb.unassigned_or_fallback_count += 1

        satisfied = sb.rank_1_count + sb.rank_2_count + sb.rank_3_count + sb.rank_4_plus_count
        sb.satisfaction_rate_percent = round(
            (satisfied / max(1, sb.total_assignments - sb.specialty_count)) * 100, 1
        )

        tensions = [
            FormationTensionItem(
                formation_id=f.id,
                code=f.code,
                name=f.name,
                domain=f.domain,
                capacity_total=f.capacity_per_rotation * rot_count,
                wishes_rank1=wishes_map.get(f.id, {}).get("rank1", 0),
                wishes_total=wishes_map.get(f.id, {}).get("total", 0),
                tension_ratio=round(
                    wishes_map.get(f.id, {}).get("total", 0) / max(1, f.capacity_per_rotation * rot_count), 2
                ),
                assigned_total=sum(
                    v for k, v in occupancy_map.get(f.id, {}).items() if 1 <= k <= rot_count
                ),
                occupancy_r1=occupancy_map.get(f.id, {}).get(1, 0),
                occupancy_r2=occupancy_map.get(f.id, {}).get(2, 0),
                occupancy_r3=occupancy_map.get(f.id, {}).get(3, 0),
                occupancy_r4=occupancy_map.get(f.id, {}).get(4, 0),
                occupancy_r5=occupancy_map.get(f.id, {}).get(5, 0),
                occupancy_r6=occupancy_map.get(f.id, {}).get(6, 0),
            )
            for f in all_formations
        ]
        tensions.sort(key=lambda t: t.tension_ratio, reverse=True)

        rot_occ: Dict[str, int] = {f"R{r}": 0 for r in range(1, rot_count + 1)}
        for a in all_assignments:
            if a.assignment_type == "FORMATION":
                rot_occ[f"R{a.rotation}"] = rot_occ.get(f"R{a.rotation}", 0) + 1

        return AllocationStatsResponse(
            total_students=total_students,
            students_with_wishes=students_with_wishes,
            students_without_wishes=total_students - students_with_wishes,
            students_pending_allocation=students_pending,
            students_fully_allocated=students_allocated,
            unassigned_wishes_total=unassigned_wishes,
            response_rate_percent=round((students_with_wishes / max(1, total_students)) * 100, 1),
            total_formations=len(all_formations),
            total_seats_capacity=total_capacity,
            total_assigned_seats=total_assigned_seats,
            overall_fill_rate_percent=round((total_assigned_seats / max(1, total_capacity)) * 100, 1),
            satisfaction=sb,
            tensions=tensions,
            rotations_occupancy=rot_occ,
        )
