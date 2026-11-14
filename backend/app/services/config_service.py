# 1. Responsabilité : Logique métier de gestion de la configuration du forum, rotations dynamiques, thème et marque blanche
# 2. Dépendances clés : re, backend.app.core.exceptions, backend.app.repositories.config_repo
# 3. Mots-clés métier : config_service, rotation_slots, rotations_count, theme_colors, home_access_instructions

import re
from backend.app.core.exceptions import DomainException
from backend.app.models.config import EventConfig
from backend.app.repositories.config_repo import ConfigRepository
from backend.app.schemas.config import (
    EventConfigResponse,
    EventConfigUpdateRequest,
    RotationTimeSlot,
)

MAX_LOGO_DATA_LEN = 750_000
ALLOWED_LOGO_PREFIXES = ("http://", "https://", "/", "data:image/")
HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


def compute_student_rotation_rules(
    level: str,
    class_mode: str,
    rot_count: int,
    spec_slots_cfg: int,
) -> tuple[int, int, int, int]:
    """Calcule (spec_slots, req_formations, min_wishes, max_wishes) pour un élève donné."""
    bounded_rots = max(2, min(6, rot_count or 4))
    bounded_spec = max(0, min(bounded_rots - 1, spec_slots_cfg))
    is_2nde = level.strip().upper() == "2NDE"
    clean_mode = (class_mode or "AUTO").strip().upper()

    if not is_2nde or bounded_spec <= 0 or clean_mode == "NONE":
        spec_slots = 0
    elif clean_mode != "AUTO":
        fixed = [
            int(r.strip())
            for r in clean_mode.split(",")
            if r.strip().isdigit() and 1 <= int(r.strip()) <= bounded_rots
        ]
        spec_slots = min(len(fixed), bounded_rots - 1) if fixed else bounded_spec
    else:
        spec_slots = bounded_spec

    req_formations = max(1, bounded_rots - spec_slots)
    min_wishes = 4 if req_formations >= 2 else req_formations
    max_wishes = 4 if req_formations <= 2 else max(6, req_formations)
    return spec_slots, req_formations, min_wishes, max_wishes


class ConfigService:
    def __init__(self, config_repo: ConfigRepository) -> None:
        self.repo = config_repo

    def get_config(self) -> EventConfigResponse:
        cfg = self.repo.get_or_create_config()
        return self._to_response(cfg)

    def update_config(self, req: EventConfigUpdateRequest) -> EventConfigResponse:
        if req.school_logo_url is not None:
            logo_val = req.school_logo_url.strip()
            if len(logo_val) > MAX_LOGO_DATA_LEN:
                raise DomainException(
                    "Le fichier logo est trop volumineux (max 500 Ko).",
                    code="LOGO_TOO_LARGE",
                )
            if logo_val and logo_val != "none" and not logo_val.startswith(ALLOWED_LOGO_PREFIXES):
                raise DomainException(
                    "Format d'URL ou d'image de logo non valide.",
                    code="INVALID_LOGO_URL",
                )
            req.school_logo_url = logo_val

        for color_field in ("theme_primary_color", "theme_secondary_color", "theme_accent_color"):
            c_val = getattr(req, color_field, None)
            if c_val is not None:
                c_clean = c_val.strip().upper()
                if not HEX_COLOR_RE.match(c_clean):
                    raise DomainException(
                        f"Couleur hexadécimale non valide ({c_val}). Attendu : #RRGGBB.",
                        code="INVALID_THEME_COLOR",
                    )
                setattr(req, color_field, c_clean)

        current_cfg = self.repo.get_or_create_config()
        target_rotations = req.rotations_count if req.rotations_count is not None else current_cfg.rotations_count
        target_spec_slots = (
            req.seconde_specialty_slots
            if req.seconde_specialty_slots is not None
            else current_cfg.seconde_specialty_slots
        )
        if target_spec_slots >= target_rotations:
            req.seconde_specialty_slots = max(0, target_rotations - 1)

        cfg = self.repo.update_config(req)
        return self._to_response(cfg)

    def _to_response(self, cfg: EventConfig) -> EventConfigResponse:
        raw_slots = [
            (1, cfg.r1_start, cfg.r1_end),
            (2, cfg.r2_start, cfg.r2_end),
            (3, cfg.r3_start, cfg.r3_end),
            (4, cfg.r4_start, cfg.r4_end),
            (5, getattr(cfg, "r5_start", "13:30") or "13:30", getattr(cfg, "r5_end", "14:20") or "14:20"),
            (6, getattr(cfg, "r6_start", "14:30") or "14:30", getattr(cfg, "r6_end", "15:20") or "15:20"),
        ]
        rot_count = max(2, min(6, getattr(cfg, "rotations_count", 4) or 4))
        spec_slots = max(0, min(rot_count - 1, getattr(cfg, "seconde_specialty_slots", 2)))

        rotations = [
            RotationTimeSlot(
                rotation=idx,
                start_time=start_t,
                end_time=end_t,
                label=f"R{idx} ({start_t.replace(':', 'h')} - {end_t.replace(':', 'h')})",
            )
            for idx, start_t, end_t in raw_slots[:rot_count]
        ]

        return EventConfigResponse(
            id=cfg.id,
            event_title=cfg.event_title,
            event_date=cfg.event_date,
            event_date_label=cfg.event_date_label,
            location=cfg.location,
            school_name=cfg.school_name,
            school_subtitle=cfg.school_subtitle,
            school_logo_url=cfg.school_logo_url,
            school_website_url=cfg.school_website_url,
            ent_name=cfg.ent_name,
            home_access_instructions=getattr(cfg, "home_access_instructions", "") or "",
            theme_primary_color=getattr(cfg, "theme_primary_color", "#272154") or "#272154",
            theme_secondary_color=getattr(cfg, "theme_secondary_color", "#312783") or "#312783",
            theme_accent_color=getattr(cfg, "theme_accent_color", "#EB5E57") or "#EB5E57",
            rotations_count=rot_count,
            seconde_specialty_slots=spec_slots,
            rotations=rotations,
            wishes_open=cfg.wishes_open,
            default_capacity=cfg.default_capacity,
            contact_email=cfg.contact_email,
            updated_at=cfg.updated_at,
        )
