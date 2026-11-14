# 1. Responsabilité : Persistance et accès aux paramètres de configuration globale de l'événement
# 2. Dépendances clés : sqlalchemy.orm, backend.app.core.config, backend.app.models.config
# 3. Mots-clés métier : config_repo, event_config, singleton_settings, persistence, white_label

from sqlalchemy.orm import Session
from backend.app.core.config import get_settings
from backend.app.models.config import EventConfig
from backend.app.schemas.config import EventConfigUpdateRequest


class ConfigRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_or_create_config(self) -> EventConfig:
        cfg = self.db.query(EventConfig).filter(EventConfig.id == 1).first()
        if not cfg:
            settings = get_settings()
            default_location = (
                f"{settings.default_school_name} - {settings.default_school_subtitle}"
                if settings.default_school_subtitle
                else settings.default_school_name
            )
            cfg = EventConfig(
                id=1,
                event_title="Forum des Métiers & des Formations",
                event_date="2027-01-20",
                event_date_label="Mercredi 20 janvier 2027",
                location=default_location,
                school_name=settings.default_school_name,
                school_subtitle=settings.default_school_subtitle,
                school_logo_url="",
                school_website_url=settings.default_school_website_url,
                ent_name=settings.default_ent_name,
                r1_start="08:30",
                r1_end="09:20",
                r2_start="09:20",
                r2_end="10:10",
                r3_start="10:20",
                r3_end="11:10",
                r4_start="11:10",
                r4_end="12:00",
                wishes_open=True,
                default_capacity=settings.default_formation_capacity,
                contact_email=settings.admin_email,
            )
            self.db.add(cfg)
            self.db.commit()
            self.db.refresh(cfg)
        return cfg

    def update_config(self, req: EventConfigUpdateRequest) -> EventConfig:
        cfg = self.get_or_create_config()
        update_data = req.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None and hasattr(cfg, key):
                setattr(cfg, key, value)
        self.db.commit()
        self.db.refresh(cfg)
        return cfg
