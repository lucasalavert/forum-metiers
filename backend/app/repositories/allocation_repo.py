# 1. Responsabilité : Persistance et mise à jour atomique des vœux et des affectations
# 2. Dépendances clés : sqlalchemy.orm, backend.app.models.allocation, backend.app.models.student
# 3. Mots-clés métier : allocation, wishes, assignments, persistence, atomic, batch, lock

from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.app.models.allocation import Wish, Assignment
from backend.app.models.student import Student


class AllocationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def save_student_wishes(self, student: Student, wish_tuples: List[tuple[int, int]]) -> None:
        self.db.query(Wish).filter(Wish.student_id == student.id).delete()
        for fid, rank in wish_tuples:
            w = Wish(student_id=student.id, formation_id=fid, rank=rank)
            self.db.add(w)
        student.wishes_submitted_at = datetime.now(timezone.utc)
        # Supprimer les affectations obsolètes de cet élève suite à la mise à jour de ses choix
        self.db.query(Assignment).filter(Assignment.student_id == student.id).delete()
        self.db.commit()
        self.db.refresh(student)

    def list_assignments_for_student(self, student_id: int) -> List[Assignment]:
        return (
            self.db.query(Assignment)
            .filter(Assignment.student_id == student_id)
            .order_by(Assignment.rotation)
            .all()
        )

    def get_assignment(self, student_id: int, rotation: int) -> Optional[Assignment]:
        return (
            self.db.query(Assignment)
            .filter(Assignment.student_id == student_id, Assignment.rotation == rotation)
            .first()
        )

    def upsert_assignment(
        self,
        student_id: int,
        rotation: int,
        assignment_type: str,
        formation_id: Optional[int],
        wish_rank_obtained: Optional[int] = None,
        is_locked: bool = False,
    ) -> Assignment:
        assignment = self.get_assignment(student_id, rotation)
        if not assignment:
            assignment = Assignment(
                student_id=student_id,
                rotation=rotation,
                assignment_type=assignment_type,
                formation_id=formation_id,
                wish_rank_obtained=wish_rank_obtained,
                is_locked=is_locked,
            )
            self.db.add(assignment)
        else:
            assignment.assignment_type = assignment_type
            assignment.formation_id = formation_id
            assignment.wish_rank_obtained = wish_rank_obtained
            assignment.is_locked = is_locked
        self.db.commit()
        self.db.refresh(assignment)
        return assignment

    def save_all_assignments(self, solved_list: List) -> None:
        existing = {
            (a.student_id, a.rotation): a
            for a in self.db.query(Assignment).all()
        }
        for sa in solved_list:
            key = (sa.student_id, sa.rotation)
            a = existing.get(key)
            if a:
                a.assignment_type = sa.assignment_type
                a.formation_id = sa.formation_id
                a.wish_rank_obtained = sa.wish_rank_obtained
                a.is_locked = sa.is_locked
            else:
                new_a = Assignment(
                    student_id=sa.student_id,
                    rotation=sa.rotation,
                    assignment_type=sa.assignment_type,
                    formation_id=sa.formation_id,
                    wish_rank_obtained=sa.wish_rank_obtained,
                    is_locked=sa.is_locked,
                )
                self.db.add(new_a)
        self.db.commit()

    def clear_unlocked_assignments(self) -> None:
        self.db.query(Assignment).filter(Assignment.is_locked.is_(False)).delete()
        self.db.commit()

    def clear_all_assignments(self) -> None:
        self.db.query(Assignment).delete()
        self.db.commit()

    def list_all_assignments(self) -> List[Assignment]:
        return (
            self.db.query(Assignment)
            .order_by(Assignment.student_id, Assignment.rotation)
            .all()
        )
