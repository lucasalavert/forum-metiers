# 1. Responsabilité : Logique métier des formations, agrégation des demandes et import CSV
# 2. Dépendances clés : backend.app.repositories.formation_repo, csv, io, typing
# 3. Mots-clés métier : formation, workshop, capacity, import_csv, service, metrics

import csv
import io
from typing import List, Optional
from backend.app.core.exceptions import EntityNotFoundError
from backend.app.models.formation import Formation
from backend.app.repositories.formation_repo import FormationRepository
from backend.app.schemas.formation import (
    FormationCreateRequest,
    FormationResponse,
    FormationUpdateRequest,
)


class FormationService:
    def __init__(self, repo: FormationRepository) -> None:
        self.repo = repo

    def list_formations(self, level: Optional[str] = None) -> List[FormationResponse]:
        entities = self.repo.list_all(level=level)
        wishes_map = self.repo.get_wishes_counts()
        occupancy_map = self.repo.get_occupancy_per_rotation()

        results: List[FormationResponse] = []
        for ent in entities:
            w_info = wishes_map.get(ent.id, {})
            occ_info = occupancy_map.get(ent.id, {})
            assigned_total = sum(occ_info.values())

            res = FormationResponse(
                id=ent.id,
                code=ent.code,
                name=ent.name,
                domain=ent.domain,
                description=ent.description,
                speaker_name=ent.speaker_name or "",
                room=ent.room or "Salle standard",
                target_levels=ent.target_levels,
                capacity_per_rotation=ent.capacity_per_rotation,
                active_rotations=ent.active_rotations,
                wishes_count_rank1=w_info.get("rank1", 0),
                wishes_count_total=w_info.get("total", 0),
                assigned_count=assigned_total,
                occupancy_r1=occ_info.get(1, 0),
                occupancy_r2=occ_info.get(2, 0),
                occupancy_r3=occ_info.get(3, 0),
                occupancy_r4=occ_info.get(4, 0),
                occupancy_r5=occ_info.get(5, 0),
                occupancy_r6=occ_info.get(6, 0),
            )
            results.append(res)
        return results

    def get_formation(self, formation_id: int) -> FormationResponse:
        ent = self.repo.get_by_id(formation_id)
        if not ent:
            raise EntityNotFoundError("Formation", formation_id)
        w_info = self.repo.get_wishes_counts().get(ent.id, {})
        occ_info = self.repo.get_occupancy_per_rotation().get(ent.id, {})

        return FormationResponse(
            id=ent.id,
            code=ent.code,
            name=ent.name,
            domain=ent.domain,
            description=ent.description,
            speaker_name=ent.speaker_name or "",
            room=ent.room or "Salle standard",
            target_levels=ent.target_levels,
            capacity_per_rotation=ent.capacity_per_rotation,
            active_rotations=ent.active_rotations,
            wishes_count_rank1=w_info.get("rank1", 0),
            wishes_count_total=w_info.get("total", 0),
            assigned_count=sum(occ_info.values()),
            occupancy_r1=occ_info.get(1, 0),
            occupancy_r2=occ_info.get(2, 0),
            occupancy_r3=occ_info.get(3, 0),
            occupancy_r4=occ_info.get(4, 0),
            occupancy_r5=occ_info.get(5, 0),
            occupancy_r6=occ_info.get(6, 0),
        )

    def create_formation(self, req: FormationCreateRequest) -> Formation:
        f = Formation(
            code=req.code.strip().upper(),
            name=req.name.strip(),
            domain=req.domain.strip(),
            description=req.description.strip(),
            speaker_name=req.speaker_name.strip() if req.speaker_name else "",
            room=req.room.strip() if req.room else "Salle standard",
            target_levels=req.target_levels.strip().upper(),
            capacity_per_rotation=req.capacity_per_rotation,
            active_rotations=req.active_rotations.strip(),
        )
        return self.repo.create(f)

    def update_formation(self, formation_id: int, req: FormationUpdateRequest) -> Formation:
        f = self.repo.get_by_id(formation_id)
        if not f:
            raise EntityNotFoundError("Formation", formation_id)

        if req.code is not None:
            f.code = req.code.strip().upper()
        if req.name is not None:
            f.name = req.name.strip()
        if req.domain is not None:
            f.domain = req.domain.strip()
        if req.description is not None:
            f.description = req.description.strip()
        if req.speaker_name is not None:
            f.speaker_name = req.speaker_name.strip()
        if req.room is not None:
            f.room = req.room.strip()
        if req.target_levels is not None:
            f.target_levels = req.target_levels.strip().upper()
        if req.capacity_per_rotation is not None:
            f.capacity_per_rotation = req.capacity_per_rotation
        if req.active_rotations is not None:
            f.active_rotations = req.active_rotations.strip()

        return self.repo.update(f)

    def delete_formation(self, formation_id: int) -> None:
        f = self.repo.get_by_id(formation_id)
        if not f:
            raise EntityNotFoundError("Formation", formation_id)
        self.repo.delete(f)

    def import_csv(self, file_content: str) -> tuple[int, int, List[str]]:
        reader = csv.DictReader(io.StringIO(file_content))
        imported, updated = 0, 0
        errors: List[str] = []

        for row_idx, row in enumerate(reader, start=1):
            code = (row.get("code") or f"FORM-{row_idx:02d}").strip().upper()
            name = (row.get("name") or row.get("nom") or "").strip()
            domain = (row.get("domain") or row.get("domaine") or "Général").strip()
            if not name:
                errors.append(f"Ligne {row_idx}: Nom de formation manquant.")
                continue

            existing = self.repo.get_by_code(code)
            cap = int(row.get("capacity") or row.get("capacite") or 20)
            levels = (row.get("levels") or row.get("niveaux") or "2NDE,1ERE,TERM").strip().upper()
            room = (row.get("room") or row.get("salle") or "Salle standard").strip()
            speaker = (row.get("speaker") or row.get("intervenant") or "").strip()
            desc = (row.get("description") or "").strip()

            if existing:
                existing.name = name
                existing.domain = domain
                existing.description = desc
                existing.speaker_name = speaker
                existing.room = room
                existing.target_levels = levels
                existing.capacity_per_rotation = cap
                self.repo.update(existing)
                updated += 1
            else:
                new_f = Formation(
                    code=code,
                    name=name,
                    domain=domain,
                    description=desc,
                    speaker_name=speaker,
                    room=room,
                    target_levels=levels,
                    capacity_per_rotation=cap,
                    active_rotations="1,2,3,4",
                )
                self.repo.create(new_f)
                imported += 1

        return imported, updated, errors
