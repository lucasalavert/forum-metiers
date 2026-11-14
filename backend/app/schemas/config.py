# 1. Responsabilité : Schémas Pydantic pour la configuration de l'événement, marque blanche, couleurs et rotations
# 2. Dépendances clés : pydantic, typing, datetime
# 3. Mots-clés métier : config_schema, rotation_slot, rotations_count, theme_colors, home_access_instructions

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class RotationTimeSlot(BaseModel):
    rotation: int = Field(..., ge=1, le=6, description="Numéro de la rotation (1 à 6)")
    start_time: str = Field(..., description="Heure de début (HH:MM)")
    end_time: str = Field(..., description="Heure de fin (HH:MM)")
    label: str = Field(..., description="Libellé complet ex: R1 (08h30 - 09h20)")


class EventConfigResponse(BaseModel):
    id: int
    event_title: str
    event_date: str
    event_date_label: str
    location: str
    school_name: str = "Lycée Général et Technologique"
    school_subtitle: str = "Forum de l'Orientation"
    school_logo_url: str = ""
    school_website_url: str = ""
    ent_name: str = "Pronote / ÉcoleDirecte"
    home_access_instructions: str = ""
    theme_primary_color: str = "#272154"
    theme_secondary_color: str = "#312783"
    theme_accent_color: str = "#EB5E57"
    rotations_count: int = 4
    seconde_specialty_slots: int = 2
    rotations: List[RotationTimeSlot]
    wishes_open: bool
    default_capacity: int
    contact_email: str
    updated_at: Optional[datetime] = None


class EventConfigUpdateRequest(BaseModel):
    event_title: Optional[str] = None
    event_date: Optional[str] = None
    event_date_label: Optional[str] = None
    location: Optional[str] = None
    school_name: Optional[str] = None
    school_subtitle: Optional[str] = None
    school_logo_url: Optional[str] = None
    school_website_url: Optional[str] = None
    ent_name: Optional[str] = None
    home_access_instructions: Optional[str] = None
    theme_primary_color: Optional[str] = None
    theme_secondary_color: Optional[str] = None
    theme_accent_color: Optional[str] = None
    rotations_count: Optional[int] = Field(default=None, ge=2, le=6)
    seconde_specialty_slots: Optional[int] = Field(default=None, ge=0, le=2)
    r1_start: Optional[str] = None
    r1_end: Optional[str] = None
    r2_start: Optional[str] = None
    r2_end: Optional[str] = None
    r3_start: Optional[str] = None
    r3_end: Optional[str] = None
    r4_start: Optional[str] = None
    r4_end: Optional[str] = None
    r5_start: Optional[str] = None
    r5_end: Optional[str] = None
    r6_start: Optional[str] = None
    r6_end: Optional[str] = None
    wishes_open: Optional[bool] = None
    default_capacity: Optional[int] = None
    contact_email: Optional[str] = None


class PurgeForumDataRequest(BaseModel):
    purge_wishes: bool = Field(default=False, description="Purger les vœux et les affectations du solveur")
    purge_students: bool = Field(default=False, description="Purger les élèves, les classes et leurs vœux/affectations")
    purge_formations: bool = Field(default=False, description="Purger le catalogue des formations (et les vœux/affectations liés)")


class PurgeForumDataResponse(BaseModel):
    deleted_formations: int
    deleted_students: int
    deleted_classes: int
    deleted_wishes: int
    deleted_assignments: int
    message: str
