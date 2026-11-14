# 1. Responsabilité : Endpoints REST pour la configuration globale, l'export d'archive annuelle (.zip) et la purge
# 2. Dépendances clés : fastapi, sqlalchemy.orm, backend.app.core.security, backend.app.services.*
# 3. Mots-clés métier : config_router, event_settings, annual_archive, selective_purge, admin_protection

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_current_admin
from backend.app.models.config import AdminUser
from backend.app.repositories.config_repo import ConfigRepository
from backend.app.schemas.config import (
    EventConfigResponse,
    EventConfigUpdateRequest,
    PurgeForumDataRequest,
    PurgeForumDataResponse,
)
from backend.app.services.config_service import ConfigService
from backend.app.services.maintenance_service import MaintenanceService

router = APIRouter(prefix="/config", tags=["Configuration Globale"])


def get_config_service(db: Session = Depends(get_db)) -> ConfigService:
    return ConfigService(ConfigRepository(db))


@router.get("", response_model=EventConfigResponse)
def get_event_config(service: ConfigService = Depends(get_config_service)) -> EventConfigResponse:
    """Consulte la configuration globale du forum. Accessible publiquement."""
    return service.get_config()


@router.put("", response_model=EventConfigResponse)
def update_event_config(
    req: EventConfigUpdateRequest,
    service: ConfigService = Depends(get_config_service),
    _admin: AdminUser = Depends(get_current_admin),
) -> EventConfigResponse:
    """Met à jour les paramètres du forum. Réservé à l'administrateur authentifié."""
    return service.update_config(req)


@router.get("/archive")
def export_annual_archive(
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
) -> Response:
    """Exporte une archive ZIP complète de l'année en cours (formations, élèves, vœux, plannings, émargement, config)."""
    zip_bytes, filename = MaintenanceService(db).build_annual_archive_zip()
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/purge", response_model=PurgeForumDataResponse)
def purge_forum_data(
    req: PurgeForumDataRequest,
    db: Session = Depends(get_db),
    _admin: AdminUser = Depends(get_current_admin),
) -> PurgeForumDataResponse:
    """Purge sélectivement les données (vœux, élèves, formations) pour préparer l'édition suivante."""
    return MaintenanceService(db).purge_forum_data(req)
