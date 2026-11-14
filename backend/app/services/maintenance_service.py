# 1. Responsabilité : Service d'archivage annuel complet (.zip) et de purge sélective pour préparer l'année suivante
# 2. Dépendances clés : csv, io, json, zipfile, sqlalchemy.orm, backend.app.models.*, backend.app.schemas.config
# 3. Mots-clés métier : annual_archive, zip_export, selective_purge, reset_year, formations, students, wishes

import csv
import io
import json
import re
import zipfile
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from backend.app.core.exceptions import DomainException
from backend.app.models.allocation import Assignment, Wish
from backend.app.models.formation import Formation
from backend.app.models.student import ClassGroupConfig, Student
from backend.app.repositories.config_repo import ConfigRepository
from backend.app.schemas.config import PurgeForumDataRequest, PurgeForumDataResponse


class MaintenanceService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def build_annual_archive_zip(self) -> tuple[bytes, str]:
        cfg = ConfigRepository(self.db).get_or_create_config()
        rot_count = max(2, min(6, getattr(cfg, "rotations_count", 4) or 4))
        formations = self.db.query(Formation).order_by(Formation.code.asc()).all()
        classes = self.db.query(ClassGroupConfig).order_by(ClassGroupConfig.class_name.asc()).all()
        class_spec_map = {c.class_name: c.specialty_rotations for c in classes}
        students = (
            self.db.query(Student)
            .options(
                joinedload(Student.wishes).joinedload(Wish.formation),
                joinedload(Student.assignments).joinedload(Assignment.formation),
            )
            .order_by(Student.class_name.asc(), Student.last_name.asc(), Student.first_name.asc())
            .all()
        )

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
            # 1. formations.csv (ré-importable tel quel)
            f_buf = io.StringIO()
            f_writer = csv.writer(f_buf)
            f_writer.writerow(["code", "name", "domain", "speaker", "room", "levels", "capacity", "description"])
            for f in formations:
                f_writer.writerow([
                    f.code, f.name, f.domain, f.speaker_name or "", f.room or "",
                    f.target_levels, f.capacity_per_rotation, f.description or "",
                ])
            zf.writestr("formations.csv", "\ufeff" + f_buf.getvalue())

            # 2. students.csv (ré-importable tel quel)
            s_buf = io.StringIO()
            s_writer = csv.writer(s_buf)
            s_writer.writerow(["nom", "prenom", "classe", "niveau", "email", "specialites", "token"])
            for s in students:
                s_writer.writerow([
                    s.last_name, s.first_name, s.class_name, s.level,
                    s.email or "", class_spec_map.get(s.class_name, "AUTO" if s.level == "2NDE" else "NONE"),
                    s.token,
                ])
            zf.writestr("students.csv", "\ufeff" + s_buf.getvalue())

            # 3. wishes.csv (ré-importable tel quel)
            w_buf = io.StringIO()
            w_writer = csv.writer(w_buf)
            w_writer.writerow(["email", "nom", "prenom", "classe", "wish_1", "wish_2", "wish_3", "wish_4", "wish_5", "wish_6"])
            for s in students:
                ordered_w = sorted(s.wishes, key=lambda w: w.rank)
                codes = [w.formation.code if w.formation else "" for w in ordered_w[:6]]
                padded = codes + [""] * (6 - len(codes))
                w_writer.writerow([s.email or "", s.last_name, s.first_name, s.class_name] + padded[:6])
            zf.writestr("wishes.csv", "\ufeff" + w_buf.getvalue())

            # 4. plannings_eleves.csv (archive complète des plannings individuels)
            p_buf = io.StringIO()
            p_writer = csv.writer(p_buf)
            rot_headers = [f"Rotation R{r}" for r in range(1, rot_count + 1)]
            p_writer.writerow(["Nom", "Prenom", "Classe", "Niveau", "Email"] + rot_headers + ["Voeux Ordonnes"])
            for s in students:
                by_rot = {a.rotation: a for a in s.assignments}
                rot_cells = []
                for r in range(1, rot_count + 1):
                    a = by_rot.get(r)
                    if not a:
                        rot_cells.append("Non affecté")
                    elif a.assignment_type == "SPECIALTY":
                        rot_cells.append("SPÉCIALITÉS (Établissement)")
                    else:
                        fname = a.formation.name if a.formation else f"Formation #{a.formation_id}"
                        froom = a.formation.room if a.formation and a.formation.room else "Salle N/C"
                        rank_lbl = f" [Vœu {a.wish_rank_obtained}]" if a.wish_rank_obtained else " [Auto]"
                        rot_cells.append(f"{fname} ({froom}){rank_lbl}")
                w_summary = " > ".join(
                    f"{w.rank}. {w.formation.code if w.formation else '?'}"
                    for w in sorted(s.wishes, key=lambda x: x.rank)
                )
                p_writer.writerow([s.last_name, s.first_name, s.class_name, s.level, s.email or ""] + rot_cells + [w_summary])
            zf.writestr("plannings_eleves.csv", "\ufeff" + p_buf.getvalue())

            # 5. emargement_salles.csv (feuilles de présence par atelier et rotation)
            e_buf = io.StringIO()
            e_writer = csv.writer(e_buf)
            e_writer.writerow(["Code_Formation", "Atelier", "Salle", "Intervenant", "Rotation", "Nom_Eleve", "Prenom_Eleve", "Classe", "Niveau", "Rang_Voeu"])
            emargement_rows = []
            for s in students:
                for a in s.assignments:
                    if a.assignment_type == "FORMATION" and a.formation:
                        emargement_rows.append((
                            a.formation.code, a.formation.name, a.formation.room or "",
                            a.formation.speaker_name or "", a.rotation,
                            s.last_name, s.first_name, s.class_name, s.level,
                            str(a.wish_rank_obtained) if a.wish_rank_obtained else "Auto",
                        ))
            emargement_rows.sort(key=lambda row: (row[0], row[4], row[5], row[6]))
            for row in emargement_rows:
                e_writer.writerow(list(row))
            zf.writestr("emargement_salles.csv", "\ufeff" + e_buf.getvalue())

            # 6. config_forum.json
            snapshot = {
                "exported_at": datetime.now(timezone.utc).isoformat(),
                "event_title": cfg.event_title,
                "event_date": cfg.event_date,
                "event_date_label": cfg.event_date_label,
                "school_name": cfg.school_name,
                "school_subtitle": cfg.school_subtitle,
                "ent_name": cfg.ent_name,
                "rotations_count": rot_count,
                "seconde_specialty_slots": getattr(cfg, "seconde_specialty_slots", 2),
                "counts": {
                    "formations": len(formations),
                    "classes": len(classes),
                    "students": len(students),
                    "wishes": sum(len(s.wishes) for s in students),
                    "assignments": sum(len(s.assignments) for s in students),
                },
            }
            zf.writestr("config_forum.json", json.dumps(snapshot, ensure_ascii=False, indent=2))

        safe_date = re.sub(r"[^a-zA-Z0-9_-]", "-", cfg.event_date or "edition")[:40]
        return zip_buffer.getvalue(), f"archive_forum_{safe_date}.zip"

    def purge_forum_data(self, req: PurgeForumDataRequest) -> PurgeForumDataResponse:
        if not (req.purge_wishes or req.purge_students or req.purge_formations):
            raise DomainException(
                "Veuillez sélectionner au moins une catégorie de données à purger.",
                code="EMPTY_PURGE_SELECTION",
            )

        # Toute purge (vœux, élèves ou formations) nécessite de vider les affectations et les vœux
        deleted_assignments = self.db.query(Assignment).delete(synchronize_session=False)
        deleted_wishes = self.db.query(Wish).delete(synchronize_session=False)

        if req.purge_students:
            deleted_students = self.db.query(Student).delete(synchronize_session=False)
            deleted_classes = self.db.query(ClassGroupConfig).delete(synchronize_session=False)
        else:
            self.db.query(Student).update({Student.wishes_submitted_at: None}, synchronize_session=False)
            deleted_students = 0
            deleted_classes = 0

        if req.purge_formations:
            deleted_formations = self.db.query(Formation).delete(synchronize_session=False)
        else:
            deleted_formations = 0

        self.db.commit()

        parts = []
        if req.purge_formations:
            parts.append(f"{deleted_formations} formation(s)")
        if req.purge_students:
            parts.append(f"{deleted_students} élève(s) et {deleted_classes} classe(s)")
        parts.append(f"{deleted_wishes} vœu(x) et {deleted_assignments} affectation(s)")

        return PurgeForumDataResponse(
            deleted_formations=deleted_formations,
            deleted_students=deleted_students,
            deleted_classes=deleted_classes,
            deleted_wishes=deleted_wishes,
            deleted_assignments=deleted_assignments,
            message=f"Purge effectuée avec succès : {', '.join(parts)} supprimés.",
        )
