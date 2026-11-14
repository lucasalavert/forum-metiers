# 1. Responsabilité : Modèle ORM pour les formations et intervenants du forum
# 2. Dépendances clés : sqlalchemy, app.core.database
# 3. Mots-clés métier : formation, workshop, speaker, room, capacity, levels, rotation

from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Formation(Base):
    __tablename__ = "formations"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False, index=True)
    domain = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False, default="")
    speaker_name = Column(String(150), nullable=True, default="")
    room = Column(String(60), nullable=True, default="Salle standard")
    target_levels = Column(String(60), nullable=False, default="2NDE,1ERE,TERM")
    capacity_per_rotation = Column(Integer, nullable=False, default=20)
    active_rotations = Column(String(30), nullable=False, default="1,2,3,4")

    wishes = relationship("Wish", back_populates="formation", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="formation")

    def is_open_to_level(self, level: str) -> bool:
        allowed = [lvl.strip().upper() for lvl in self.target_levels.split(",") if lvl.strip()]
        return level.strip().upper() in allowed
