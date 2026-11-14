# 1. Responsabilité : Modèles ORM pour les élèves, leurs tokens uniques et la configuration des classes de Seconde
# 2. Dépendances clés : sqlalchemy, app.core.database
# 3. Mots-clés métier : student, class_group, token, level, specialty_rotations, wishes, assignments

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class ClassGroupConfig(Base):
    __tablename__ = "class_group_configs"

    id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String(40), unique=True, index=True, nullable=False)
    level = Column(String(20), nullable=False, default="2NDE")
    specialty_rotations = Column(String(20), nullable=False, default="AUTO")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(64), unique=True, index=True, nullable=False)
    first_name = Column(String(80), nullable=False)
    last_name = Column(String(80), nullable=False)
    class_name = Column(String(40), index=True, nullable=False)
    level = Column(String(20), index=True, nullable=False)
    email = Column(String(160), nullable=True, default=None)
    wishes_submitted_at = Column(DateTime, nullable=True, default=None)

    wishes = relationship(
        "Wish",
        back_populates="student",
        cascade="all, delete-orphan",
        order_by="Wish.rank"
    )
    assignments = relationship(
        "Assignment",
        back_populates="student",
        cascade="all, delete-orphan",
        order_by="Assignment.rotation"
    )
