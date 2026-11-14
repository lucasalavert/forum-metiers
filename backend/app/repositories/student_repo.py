# 1. Responsabilité : Accès aux données et filtres de recherche pour les élèves et configurations de classes
# 2. Dépendances clés : sqlalchemy.orm, backend.app.models.student, backend.app.models.allocation
# 3. Mots-clés métier : student, class_config, repository, token, filtering, wishes_status, crud

from typing import List, Optional, Tuple
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from backend.app.models.student import Student, ClassGroupConfig
from backend.app.models.allocation import Wish, Assignment


class StudentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, student_id: int) -> Optional[Student]:
        return (
            self.db.query(Student)
            .options(
                joinedload(Student.wishes).joinedload(Wish.formation),
                joinedload(Student.assignments).joinedload(Assignment.formation),
            )
            .filter(Student.id == student_id)
            .first()
        )

    def get_by_token(self, token: str) -> Optional[Student]:
        return (
            self.db.query(Student)
            .options(
                joinedload(Student.wishes).joinedload(Wish.formation),
                joinedload(Student.assignments).joinedload(Assignment.formation),
            )
            .filter(Student.token == token)
            .first()
        )

    def list_filtered(
        self,
        level: Optional[str] = None,
        class_name: Optional[str] = None,
        has_wishes: Optional[bool] = None,
        search: Optional[str] = None,
        offset: int = 0,
        limit: int = 50,
    ) -> Tuple[List[Student], int]:
        query = self.db.query(Student).options(
            joinedload(Student.wishes),
            joinedload(Student.assignments).joinedload(Assignment.formation),
        )

        if level:
            query = query.filter(Student.level == level.strip().upper())
        if class_name:
            query = query.filter(Student.class_name == class_name.strip())
        if has_wishes is True:
            query = query.filter(Student.wishes_submitted_at.isnot(None))
        elif has_wishes is False:
            query = query.filter(Student.wishes_submitted_at.is_(None))
        if search:
            pattern = f"%{search.strip().lower()}%"
            query = query.filter(
                func.lower(Student.first_name + " " + Student.last_name).like(pattern)
                | func.lower(Student.class_name).like(pattern)
            )

        total = query.count()
        items = (
            query.order_by(Student.class_name, Student.last_name, Student.first_name)
            .offset(offset)
            .limit(limit)
            .all()
        )
        return items, total

    def list_all(self) -> List[Student]:
        return (
            self.db.query(Student)
            .options(
                joinedload(Student.wishes),
                joinedload(Student.assignments),
            )
            .order_by(Student.class_name, Student.last_name)
            .all()
        )

    def create(self, student: Student) -> Student:
        self.db.add(student)
        self.db.commit()
        self.db.refresh(student)
        return student

    def delete(self, student: Student) -> None:
        self.db.delete(student)
        self.db.commit()

    def list_class_configs(self) -> List[ClassGroupConfig]:
        return self.db.query(ClassGroupConfig).order_by(ClassGroupConfig.class_name).all()

    def get_class_config(self, class_name: str) -> Optional[ClassGroupConfig]:
        return (
            self.db.query(ClassGroupConfig)
            .filter(ClassGroupConfig.class_name == class_name.strip())
            .first()
        )

    def upsert_class_config(self, class_name: str, level: str, specialty_rotations: str) -> ClassGroupConfig:
        cfg = self.get_class_config(class_name)
        if not cfg:
            cfg = ClassGroupConfig(
                class_name=class_name.strip(),
                level=level.strip().upper(),
                specialty_rotations=specialty_rotations.strip(),
            )
            self.db.add(cfg)
        else:
            cfg.level = level.strip().upper()
            cfg.specialty_rotations = specialty_rotations.strip()
        self.db.commit()
        self.db.refresh(cfg)
        return cfg
