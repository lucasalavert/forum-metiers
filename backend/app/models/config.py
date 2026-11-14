# 1. Responsabilité : Modèles ORM pour la configuration générale du forum, marque blanche, couleurs et comptes admin
# 2. Dépendances clés : sqlalchemy, backend.app.core.database, datetime
# 3. Mots-clés métier : event_config, admin_user, rotations_count, theme_colors, home_access_instructions, white_label

from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from backend.app.core.database import Base


class EventConfig(Base):
    __tablename__ = "event_config"

    id = Column(Integer, primary_key=True, index=True)
    event_title = Column(String(200), nullable=False, default="Forum des Métiers & des Formations")
    event_date = Column(String(50), nullable=False, default="2027-01-20")
    event_date_label = Column(String(100), nullable=False, default="Mercredi 20 janvier 2027")
    location = Column(String(200), nullable=False, default="Lycée Général et Technologique")
    school_name = Column(String(200), nullable=False, default="Lycée Général et Technologique")
    school_subtitle = Column(String(200), nullable=False, default="Forum de l'Orientation")
    school_logo_url = Column(Text, nullable=False, default="")
    school_website_url = Column(String(300), nullable=False, default="")
    ent_name = Column(String(100), nullable=False, default="Pronote / ÉcoleDirecte")
    home_access_instructions = Column(Text, nullable=False, default="")

    # Couleurs personnalisables du thème (Marque Blanche)
    theme_primary_color = Column(String(20), nullable=False, default="#272154")
    theme_secondary_color = Column(String(20), nullable=False, default="#312783")
    theme_accent_color = Column(String(20), nullable=False, default="#EB5E57")

    # Paramétrage dynamique des rotations (2 à 6) et des créneaux de spécialités en Seconde (0 à 2)
    rotations_count = Column(Integer, nullable=False, default=4)
    seconde_specialty_slots = Column(Integer, nullable=False, default=2)

    # Horaires des rotations R1 à R6 (HH:MM)
    r1_start = Column(String(5), nullable=False, default="08:30")
    r1_end = Column(String(5), nullable=False, default="09:20")
    r2_start = Column(String(5), nullable=False, default="09:20")
    r2_end = Column(String(5), nullable=False, default="10:10")
    r3_start = Column(String(5), nullable=False, default="10:20")
    r3_end = Column(String(5), nullable=False, default="11:10")
    r4_start = Column(String(5), nullable=False, default="11:10")
    r4_end = Column(String(5), nullable=False, default="12:00")
    r5_start = Column(String(5), nullable=False, default="13:30")
    r5_end = Column(String(5), nullable=False, default="14:20")
    r6_start = Column(String(5), nullable=False, default="14:30")
    r6_end = Column(String(5), nullable=False, default="15:20")

    wishes_open = Column(Boolean, nullable=False, default=True)
    default_capacity = Column(Integer, nullable=False, default=20)
    contact_email = Column(String(100), nullable=False, default="admin@etablissement.fr")
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    salt = Column(String(32), nullable=False)
    full_name = Column(String(100), nullable=False, default="Administrateur Forum")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_login = Column(DateTime, nullable=True)
