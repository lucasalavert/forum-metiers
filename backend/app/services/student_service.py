# 1. Responsabilité : Logique métier élèves, génération de tokens uniques, portail élève et imports CSV (élèves & vœux)
# 2. Dépendances clés : backend.app.repositories.*, backend.app.services.config_service, csv, io, datetime
# 3. Mots-clés métier : student, token, portal, wishes, specialty_rotations, import_csv, import_wishes_csv

import csv
import io
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from backend.app.core.exceptions import EntityNotFoundError
from backend.app.core.security import generate_student_token
from backend.app.models.allocation import Wish
from backend.app.models.student import Student
from backend.app.repositories.config_repo import ConfigRepository
from backend.app.repositories.formation_repo import FormationRepository
from backend.app.repositories.student_repo import StudentRepository
from backend.app.schemas.student import (
    AssignmentBriefResponse,
    ClassConfigResponse,
    StudentCreateRequest,
    StudentPortalResponse,
    StudentResponse,
    StudentUpdateRequest,
)
from backend.app.schemas.wish import WishDetailResponse
from backend.app.services.config_service import compute_student_rotation_rules


class StudentService:
    def __init__(self, repo: StudentRepository, formation_repo: FormationRepository) -> None:
        self.repo = repo
        self.formation_repo = formation_repo

    @staticmethod
    def generate_token(seed_key: str = "") -> str:
        return generate_student_token(seed_key=seed_key, deterministic=False)

    def regenerate_student_token(self, student_id: int) -> StudentResponse:
        student = self.repo.get_by_id(student_id)
        if not student:
            raise EntityNotFoundError("Student", student_id)
        student.token = self.generate_token(f"{student.first_name}:{student.last_name}")
        self.repo.db.commit()
        self.repo.db.refresh(student)
        return self._to_student_response(student)

    def regenerate_all_tokens(self) -> int:
        all_students = self.repo.list_all()
        for s in all_students:
            s.token = self.generate_token(f"{s.first_name}:{s.last_name}:{s.class_name}")
        self.repo.db.commit()
        return len(all_students)

    def list_students(
        self,
        level: Optional[str] = None,
        class_name: Optional[str] = None,
        has_wishes: Optional[bool] = None,
        search: Optional[str] = None,
        page: int = 1,
        size: int = 50,
    ) -> Tuple[List[StudentResponse], int]:
        offset = (page - 1) * size
        students, total = self.repo.list_filtered(
            level=level, class_name=class_name, has_wishes=has_wishes, search=search, offset=offset, limit=size
        )
        return [self._to_student_response(s) for s in students], total

    def get_student(self, student_id: int) -> StudentResponse:
        student = self.repo.get_by_id(student_id)
        if not student:
            raise EntityNotFoundError("Student", student_id)
        return self._to_student_response(student)

    def get_student_by_token(self, token: str) -> StudentPortalResponse:
        student = self.repo.get_by_token(token)
        if not student:
            raise EntityNotFoundError("StudentPortal", token)

        event_cfg = ConfigRepository(self.repo.db).get_or_create_config()
        rot_count = getattr(event_cfg, "rotations_count", 4) or 4
        spec_slots_cfg = getattr(event_cfg, "seconde_specialty_slots", 2)
        class_cfg = self.repo.get_class_config(student.class_name)
        class_mode = class_cfg.specialty_rotations if class_cfg else "AUTO"

        spec_slots, req_formations, _, req_wishes = compute_student_rotation_rules(
            student.level, class_mode, rot_count, spec_slots_cfg
        )
        has_spec = spec_slots > 0
        clean_mode = class_mode.strip().upper()

        if not has_spec:
            spec_label = f"Aucun ({req_formations} formations)"
        elif clean_mode not in ("AUTO", "NONE") and class_cfg:
            spec_label = f"Rotation(s) {class_cfg.specialty_rotations} réservée(s) aux Spécialités"
        else:
            plural = "x" if spec_slots > 1 else ""
            spec_label = f"{spec_slots} créneau{plural} Spécialités (selon planning classe)"

        wishes_dtos = [
            WishDetailResponse(
                id=w.id,
                formation_id=w.formation_id,
                formation_name=w.formation.name if w.formation else "Formation inconnue",
                formation_domain=w.formation.domain if w.formation else "",
                rank=w.rank,
            )
            for w in student.wishes
        ]

        return StudentPortalResponse(
            id=student.id,
            first_name=student.first_name,
            last_name=student.last_name,
            class_name=student.class_name,
            level=student.level,
            required_wishes_count=req_wishes,
            required_formations_count=req_formations,
            has_specialty_rotations=has_spec,
            specialty_rotations_label=spec_label,
            wishes_submitted_at=student.wishes_submitted_at,
            wishes=wishes_dtos,
            assignments=[self._to_assignment_brief(a) for a in student.assignments],
        )

    def create_student(self, req: StudentCreateRequest) -> Student:
        student = Student(
            token=self.generate_token(),
            first_name=req.first_name.strip(),
            last_name=req.last_name.strip().upper(),
            class_name=req.class_name.strip(),
            level=req.level.strip().upper(),
            email=req.email.strip() if req.email else None,
        )
        created = self.repo.create(student)
        if not self.repo.get_class_config(created.class_name):
            self.repo.upsert_class_config(
                created.class_name, created.level, "AUTO" if created.level == "2NDE" else "NONE"
            )
        return created

    def update_student(self, student_id: int, req: StudentUpdateRequest) -> Student:
        student = self.repo.get_by_id(student_id)
        if not student:
            raise EntityNotFoundError("Student", student_id)
        if req.first_name is not None:
            student.first_name = req.first_name.strip()
        if req.last_name is not None:
            student.last_name = req.last_name.strip().upper()
        if req.class_name is not None:
            student.class_name = req.class_name.strip()
        if req.level is not None:
            student.level = req.level.strip().upper()
        if req.email is not None:
            student.email = req.email.strip() if req.email else None
        self.repo.db.commit()
        self.repo.db.refresh(student)
        return student

    def delete_student(self, student_id: int) -> None:
        student = self.repo.get_by_id(student_id)
        if not student:
            raise EntityNotFoundError("Student", student_id)
        self.repo.delete(student)

    def list_class_configs(self) -> List[ClassConfigResponse]:
        configs = self.repo.list_class_configs()
        counts: dict[str, int] = {}
        for s in self.repo.list_all():
            counts[s.class_name] = counts.get(s.class_name, 0) + 1
        return [
            ClassConfigResponse(
                id=c.id, class_name=c.class_name, level=c.level,
                specialty_rotations=c.specialty_rotations, students_count=counts.get(c.class_name, 0),
            )
            for c in configs
        ]

    def update_class_specialty_rotations(self, class_name: str, specialty_rotations: str) -> ClassConfigResponse:
        cfg = self.repo.get_class_config(class_name)
        if not cfg:
            raise EntityNotFoundError("ClassGroupConfig", class_name)
        cfg.specialty_rotations = specialty_rotations.strip()
        self.repo.db.commit()
        self.repo.db.refresh(cfg)
        students_count = len([s for s in self.repo.list_all() if s.class_name == class_name])
        return ClassConfigResponse(
            id=cfg.id, class_name=cfg.class_name, level=cfg.level,
            specialty_rotations=cfg.specialty_rotations, students_count=students_count,
        )

    def import_csv(self, file_content: str) -> tuple[int, int, List[str]]:
        reader = csv.DictReader(io.StringIO(file_content))
        imported, updated, errors = 0, 0, []

        for row_idx, row in enumerate(reader, start=1):
            fname = (row.get("prenom") or row.get("first_name") or "").strip()
            lname = (row.get("nom") or row.get("last_name") or "").strip().upper()
            cname = (row.get("classe") or row.get("class_name") or "").strip()
            lvl = (row.get("niveau") or row.get("level") or "").strip().upper()
            email = (row.get("email") or "").strip() or None
            spec_override = (row.get("specialites") or row.get("specialty_rotations") or "").strip()

            if not fname or not lname or not cname:
                errors.append(f"Ligne {row_idx}: Prénom, Nom ou Classe manquant.")
                continue
            if not lvl:
                lvl = "2NDE" if ("2" in cname or "SEC" in cname.upper()) else ("1ERE" if ("1" in cname or "PREM" in cname.upper()) else "TERM")

            self.repo.create(
                Student(token=self.generate_token(), first_name=fname, last_name=lname, class_name=cname, level=lvl, email=email)
            )
            imported += 1
            default_spec = spec_override or ("AUTO" if lvl == "2NDE" else "NONE")
            if not self.repo.get_class_config(cname) or spec_override:
                self.repo.upsert_class_config(cname, lvl, default_spec)

        return imported, updated, errors

    def import_wishes_csv(self, file_content: str) -> tuple[int, int, List[str]]:
        reader = csv.DictReader(io.StringIO(file_content))
        wishes_imported, students_updated, errors = 0, 0, []
        all_students = self.repo.list_all()
        by_email = {s.email.lower(): s for s in all_students if s.email}
        by_identity = {(s.last_name.upper(), s.first_name.lower(), s.class_name.lower()): s for s in all_students}
        formations_by_code = {f.code.upper(): f for f in self.formation_repo.list_all()}
        now = datetime.now(timezone.utc)

        for row_idx, row in enumerate(reader, start=1):
            email = (row.get("email") or "").strip().lower()
            lname = (row.get("nom") or row.get("last_name") or "").strip().upper()
            fname = (row.get("prenom") or row.get("first_name") or "").strip().lower()
            cname = (row.get("classe") or row.get("class_name") or "").strip().lower()

            student = by_email.get(email) if email else None
            if not student and lname and fname:
                student = by_identity.get((lname, fname, cname))
            if not student:
                errors.append(f"Ligne {row_idx}: Élève introuvable ({email or f'{lname} {fname}'}).")
                continue

            codes = []
            for rank in range(1, 7):
                c = (row.get(f"wish_{rank}") or row.get(f"voeu_{rank}") or "").strip().upper()
                if c and c not in codes:
                    codes.append(c)
            if not codes:
                errors.append(f"Ligne {row_idx}: Aucun code formation trouvé.")
                continue

            self.repo.db.query(Wish).filter(Wish.student_id == student.id).delete()
            for rank_idx, code in enumerate(codes, start=1):
                form = formations_by_code.get(code)
                if not form:
                    errors.append(f"Ligne {row_idx}: Code formation '{code}' inconnu.")
                    continue
                self.repo.db.add(Wish(student_id=student.id, formation_id=form.id, rank=rank_idx))
                wishes_imported += 1

            student.wishes_submitted_at = now
            students_updated += 1

        self.repo.db.commit()
        return wishes_imported, students_updated, errors

    def _to_assignment_brief(self, a) -> AssignmentBriefResponse:
        f_name = a.formation.name if a.formation else None
        f_room = a.formation.room if a.formation else None
        spk = a.formation.speaker_name if a.formation else None
        if a.assignment_type == "SPECIALTY":
            f_name = "Présentation des Enseignements de Spécialité"
            f_room = "Amphithéâtre / Salles dédiées"
            spk = "Équipe pédagogique de l'établissement"
        return AssignmentBriefResponse(
            rotation=a.rotation, assignment_type=a.assignment_type, formation_id=a.formation_id,
            formation_name=f_name, formation_room=f_room, speaker_name=spk,
            wish_rank_obtained=a.wish_rank_obtained, is_locked=a.is_locked,
        )

    def _to_student_response(self, s: Student) -> StudentResponse:
        return StudentResponse(
            id=s.id, token=s.token, first_name=s.first_name, last_name=s.last_name,
            class_name=s.class_name, level=s.level, email=s.email,
            wishes_submitted_at=s.wishes_submitted_at, wishes_count=len(s.wishes),
            assignments=[self._to_assignment_brief(a) for a in s.assignments],
        )
