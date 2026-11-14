# 1. Responsabilité : Exportation centralisée des modèles ORM du forum
# 2. Dépendances clés : backend.app.models.*
# 3. Mots-clés métier : orm, models, export, formation, student, wish, assignment

from backend.app.models.formation import Formation
from backend.app.models.student import Student, ClassGroupConfig
from backend.app.models.allocation import Wish, Assignment
from backend.app.models.config import EventConfig, AdminUser

__all__ = [
    "Formation",
    "Student",
    "ClassGroupConfig",
    "Wish",
    "Assignment",
    "EventConfig",
    "AdminUser",
]
