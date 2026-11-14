# 1. Responsabilité : Algorithme pur d'affectation des élèves sur N rotations (2 à 6) avec spécialités paramétrables
# 2. Dépendances clés : dataclasses, typing
# 3. Mots-clés métier : solver, optimization, dynamic_rotations, specialties, tension, 2opt_swap

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple


@dataclass
class FormationInput:
    id: int
    code: str
    name: str
    domain: str
    target_levels: Set[str]
    capacity_per_rotation: int = 20
    active_rotations: Set[int] = field(default_factory=lambda: {1, 2, 3, 4})


@dataclass
class StudentInput:
    id: int
    level: str
    class_name: str
    wishes: List[Tuple[int, int]]  # (formation_id, rank)


@dataclass
class SolvedAssignment:
    student_id: int
    rotation: int
    assignment_type: str  # "FORMATION" ou "SPECIALTY"
    formation_id: Optional[int]
    wish_rank_obtained: Optional[int]
    is_locked: bool = False


class SolverEngine:
    def __init__(
        self,
        formations: Dict[int, FormationInput],
        students: Dict[int, StudentInput],
        class_configs: Dict[str, str],
        locked_assignments: List[SolvedAssignment],
        auto_fill_missing: bool = True,
        rotations_count: int = 4,
        seconde_specialty_slots: int = 2,
    ) -> None:
        self.formations = formations
        self.students = students
        self.class_configs = class_configs
        self.locked_assignments = locked_assignments
        self.auto_fill_missing = auto_fill_missing
        self.rotations_count = max(2, min(6, rotations_count))
        self.seconde_specialty_slots = max(0, min(self.rotations_count - 1, seconde_specialty_slots))
        self.all_rotations = list(range(1, self.rotations_count + 1))

        self.assignments: Dict[int, Dict[int, SolvedAssignment]] = {sid: {} for sid in students.keys()}
        self.occupancy: Dict[int, Dict[int, int]] = {
            fid: {r: 0 for r in self.all_rotations} for fid in formations.keys()
        }

    def solve(self) -> List[SolvedAssignment]:
        self._preassign_fixed_specialties()
        self._apply_locked_assignments()
        tensions = self._compute_tensions()
        self._allocate_wishes_by_rank(tensions)
        self._optimize_with_swaps()
        self._finalize_auto_specialties()
        if self.auto_fill_missing:
            self._fill_remaining_slots()

        return [
            rots[rot]
            for rots in self.assignments.values()
            for rot in self.all_rotations
            if rot in rots
        ]

    def _student_specialty_slots_count(self, s: StudentInput) -> int:
        if s.level.upper() != "2NDE" or self.seconde_specialty_slots <= 0:
            return 0
        cfg = self.class_configs.get(s.class_name, "AUTO").strip().upper()
        if cfg == "NONE":
            return 0
        if cfg != "AUTO":
            fixed = [
                int(r.strip())
                for r in cfg.split(",")
                if r.strip().isdigit() and 1 <= int(r.strip()) <= self.rotations_count
            ]
            if fixed:
                return min(len(fixed), self.rotations_count - 1)
        return self.seconde_specialty_slots

    def _student_max_formations(self, s: StudentInput) -> int:
        return max(0, self.rotations_count - self._student_specialty_slots_count(s))

    def _apply_locked_assignments(self) -> None:
        for lock in self.locked_assignments:
            if lock.student_id in self.assignments and 1 <= lock.rotation <= self.rotations_count:
                existing = self.assignments[lock.student_id].get(lock.rotation)
                if existing and existing.assignment_type == "SPECIALTY" and lock.assignment_type == "FORMATION":
                    continue
                self.assignments[lock.student_id][lock.rotation] = lock
                if lock.assignment_type == "FORMATION" and lock.formation_id in self.occupancy:
                    self.occupancy[lock.formation_id][lock.rotation] += 1

    def _preassign_fixed_specialties(self) -> None:
        if self.seconde_specialty_slots <= 0:
            return
        for sid, s in self.students.items():
            if s.level.upper() != "2NDE":
                continue
            cfg = self.class_configs.get(s.class_name, "AUTO").strip().upper()
            if cfg in ("AUTO", "NONE"):
                continue
            fixed_rots = [
                int(r.strip())
                for r in cfg.split(",")
                if r.strip().isdigit() and 1 <= int(r.strip()) <= self.rotations_count
            ]
            for r in fixed_rots[: self.rotations_count - 1]:
                self.assignments[sid][r] = SolvedAssignment(
                    student_id=sid,
                    rotation=r,
                    assignment_type="SPECIALTY",
                    formation_id=None,
                    wish_rank_obtained=None,
                )

    def _compute_tensions(self) -> Dict[int, float]:
        scores: Dict[int, float] = {fid: 0.0 for fid in self.formations.keys()}
        for s in self.students.values():
            for fid, rank in s.wishes:
                if fid in scores:
                    scores[fid] += max(1.0, 7.0 - rank)
        tensions: Dict[int, float] = {}
        for fid, f in self.formations.items():
            active_cnt = len([r for r in f.active_rotations if 1 <= r <= self.rotations_count]) or 1
            tensions[fid] = scores[fid] / max(1.0, float(f.capacity_per_rotation * active_cnt))
        return tensions

    def _student_needs_formation(self, s: StudentInput) -> bool:
        current_f = sum(1 for a in self.assignments[s.id].values() if a.assignment_type == "FORMATION")
        return current_f < self._student_max_formations(s)

    def _allocate_wishes_by_rank(self, tensions: Dict[int, float]) -> None:
        for rank in range(1, 7):
            wishes_at_rank: List[Tuple[int, int, float]] = []
            for sid, s in self.students.items():
                if self._student_needs_formation(s):
                    for fid, rk in s.wishes:
                        if rk == rank and fid in self.formations:
                            wishes_at_rank.append((sid, fid, tensions.get(fid, 0.0)))

            wishes_at_rank.sort(key=lambda item: item[2], reverse=True)

            for sid, fid, _ in wishes_at_rank:
                s = self.students[sid]
                f = self.formations[fid]
                if not self._student_needs_formation(s) or s.level.upper() not in f.target_levels:
                    continue
                if any(a.formation_id == fid for a in self.assignments[sid].values()):
                    continue

                best_rot: Optional[int] = None
                max_left = -1
                for rot in self.all_rotations:
                    if rot in self.assignments[sid] or rot not in f.active_rotations:
                        continue
                    left = f.capacity_per_rotation - self.occupancy[fid][rot]
                    if left > 0 and left > max_left:
                        max_left = left
                        best_rot = rot

                if best_rot is not None:
                    self.assignments[sid][best_rot] = SolvedAssignment(
                        student_id=sid,
                        rotation=best_rot,
                        assignment_type="FORMATION",
                        formation_id=fid,
                        wish_rank_obtained=rank,
                    )
                    self.occupancy[fid][best_rot] += 1

    def _optimize_with_swaps(self) -> None:
        for sid, s in self.students.items():
            if not self._student_needs_formation(s):
                continue
            for fid, rank in s.wishes:
                if rank > 2:
                    break
                if any(a.formation_id == fid for a in self.assignments[sid].values()):
                    continue
                f = self.formations.get(fid)
                if not f or s.level.upper() not in f.target_levels:
                    continue

                avail_rotations = [
                    r for r in f.active_rotations
                    if r in self.occupancy[fid] and self.occupancy[fid][r] < f.capacity_per_rotation
                ]
                free_rots = [r for r in self.all_rotations if r not in self.assignments[sid]]

                for r_avail in avail_rotations:
                    curr = self.assignments[sid].get(r_avail)
                    if not curr or curr.is_locked or curr.assignment_type != "FORMATION" or not curr.formation_id:
                        continue
                    g_id = curr.formation_id
                    g = self.formations.get(g_id)
                    if not g:
                        continue

                    for r_free in free_rots:
                        if r_free in g.active_rotations and self.occupancy[g_id][r_free] < g.capacity_per_rotation:
                            self.occupancy[g_id][r_avail] -= 1
                            self.occupancy[g_id][r_free] += 1
                            self.assignments[sid][r_free] = SolvedAssignment(
                                student_id=sid,
                                rotation=r_free,
                                assignment_type="FORMATION",
                                formation_id=g_id,
                                wish_rank_obtained=curr.wish_rank_obtained,
                            )
                            self.assignments[sid][r_avail] = SolvedAssignment(
                                student_id=sid,
                                rotation=r_avail,
                                assignment_type="FORMATION",
                                formation_id=fid,
                                wish_rank_obtained=rank,
                            )
                            self.occupancy[fid][r_avail] += 1
                            break
                    if any(a.formation_id == fid for a in self.assignments[sid].values()):
                        break

    def _finalize_auto_specialties(self) -> None:
        for sid, s in self.students.items():
            target_spec = self._student_specialty_slots_count(s)
            if target_spec <= 0:
                continue
            spec_count = sum(1 for a in self.assignments[sid].values() if a.assignment_type == "SPECIALTY")
            needed = target_spec - spec_count
            if needed <= 0:
                continue
            empty_rots = [r for r in self.all_rotations if r not in self.assignments[sid]]
            for rot in empty_rots[:needed]:
                self.assignments[sid][rot] = SolvedAssignment(
                    student_id=sid,
                    rotation=rot,
                    assignment_type="SPECIALTY",
                    formation_id=None,
                    wish_rank_obtained=None,
                )

    def _fill_remaining_slots(self) -> None:
        sorted_formations = sorted(
            self.formations.values(),
            key=lambda f: sum(self.occupancy[f.id].values()),
        )
        for sid, s in self.students.items():
            target_count = self._student_max_formations(s)
            for rot in self.all_rotations:
                if rot in self.assignments[sid]:
                    continue
                current_f = sum(1 for a in self.assignments[sid].values() if a.assignment_type == "FORMATION")
                if current_f >= target_count:
                    continue
                for f in sorted_formations:
                    if s.level.upper() not in f.target_levels or rot not in f.active_rotations:
                        continue
                    if any(a.formation_id == f.id for a in self.assignments[sid].values()):
                        continue
                    if self.occupancy[f.id][rot] < f.capacity_per_rotation:
                        self.assignments[sid][rot] = SolvedAssignment(
                            student_id=sid,
                            rotation=rot,
                            assignment_type="FORMATION",
                            formation_id=f.id,
                            wish_rank_obtained=None,
                        )
                        self.occupancy[f.id][rot] += 1
                        break
