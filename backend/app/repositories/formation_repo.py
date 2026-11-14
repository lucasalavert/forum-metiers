# 1. Responsabilité : Accès aux données et requêtes d'agrégation pour les formations
# 2. Dépendances clés : sqlalchemy.orm, backend.app.models.formation, backend.app.models.allocation
# 3. Mots-clés métier : formation, repository, crud, capacity, occupancy, aggregate

from typing import Dict, List, Optional
from sqlalchemy import func
from sqlalchemy.orm import Session
from backend.app.models.formation import Formation
from backend.app.models.allocation import Wish, Assignment


class FormationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, formation_id: int) -> Optional[Formation]:
        return self.db.query(Formation).filter(Formation.id == formation_id).first()

    def get_by_code(self, code: str) -> Optional[Formation]:
        return self.db.query(Formation).filter(Formation.code == code).first()

    def list_all(self, level: Optional[str] = None) -> List[Formation]:
        query = self.db.query(Formation)
        formations = query.order_by(Formation.domain, Formation.name).all()
        if level:
            level_clean = level.strip().upper()
            return [f for f in formations if f.is_open_to_level(level_clean)]
        return formations

    def create(self, formation: Formation) -> Formation:
        self.db.add(formation)
        self.db.commit()
        self.db.refresh(formation)
        return formation

    def update(self, formation: Formation) -> Formation:
        self.db.commit()
        self.db.refresh(formation)
        return formation

    def delete(self, formation: Formation) -> None:
        self.db.delete(formation)
        self.db.commit()

    def get_wishes_counts(self) -> Dict[int, Dict[str, int]]:
        rank1_q = (
            self.db.query(Wish.formation_id, func.count(Wish.id))
            .filter(Wish.rank == 1)
            .group_by(Wish.formation_id)
            .all()
        )
        total_q = (
            self.db.query(Wish.formation_id, func.count(Wish.id))
            .group_by(Wish.formation_id)
            .all()
        )
        counts: Dict[int, Dict[str, int]] = {}
        for fid, count in rank1_q:
            counts.setdefault(fid, {})["rank1"] = count
        for fid, count in total_q:
            counts.setdefault(fid, {})["total"] = count
        return counts

    def get_occupancy_per_rotation(self) -> Dict[int, Dict[int, int]]:
        rows = (
            self.db.query(Assignment.formation_id, Assignment.rotation, func.count(Assignment.id))
            .filter(Assignment.formation_id.isnot(None))
            .group_by(Assignment.formation_id, Assignment.rotation)
            .all()
        )
        occupancies: Dict[int, Dict[int, int]] = {}
        for fid, rot, cnt in rows:
            occupancies.setdefault(fid, {})[rot] = cnt
        return occupancies
