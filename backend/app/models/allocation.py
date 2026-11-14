# 1. Responsabilité : Modèles ORM pour les vœux des élèves et les affectations par rotation
# 2. Dépendances clés : sqlalchemy, app.core.database
# 3. Mots-clés métier : wish, rank, assignment, rotation, specialty, locked, solver, schedule

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Wish(Base):
    __tablename__ = "wishes"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    formation_id = Column(Integer, ForeignKey("formations.id", ondelete="CASCADE"), nullable=False, index=True)
    rank = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint("student_id", "rank", name="uq_student_wish_rank"),
        UniqueConstraint("student_id", "formation_id", name="uq_student_wish_formation"),
    )

    student = relationship("Student", back_populates="wishes")
    formation = relationship("Formation", back_populates="wishes")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    rotation = Column(Integer, nullable=False)
    assignment_type = Column(String(30), nullable=False, default="FORMATION")
    formation_id = Column(Integer, ForeignKey("formations.id", ondelete="SET NULL"), nullable=True, index=True)
    wish_rank_obtained = Column(Integer, nullable=True, default=None)
    is_locked = Column(Boolean, nullable=False, default=False)

    __table_args__ = (
        UniqueConstraint("student_id", "rotation", name="uq_student_assignment_rotation"),
    )

    student = relationship("Student", back_populates="assignments")
    formation = relationship("Formation", back_populates="assignments")
