# 1. Responsabilité : Points de terminaison HTTP pour la consultation publique et l'administration (JWT) des formations
# 2. Dépendances clés : fastapi, sqlalchemy.orm, backend.app.core.security, backend.app.services.formation_service
# 3. Mots-clés métier : formations, workshops, crud, api_router, capacity, csv_import, admin_protected

from typing import Optional
from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.rate_limit import read_bounded_csv_content
from backend.app.core.security import get_current_admin
from backend.app.models.config import AdminUser
from backend.app.repositories.formation_repo import FormationRepository
from backend.app.schemas.allocation import CSVImportResultResponse
from backend.app.schemas.formation import (
    FormationCreateRequest,
    FormationListResponse,
    FormationResponse,
    FormationUpdateRequest,
)
from backend.app.services.formation_service import FormationService

router = APIRouter(prefix="/formations", tags=["Formations"])


def get_service(db: Session = Depends(get_db)) -> FormationService:
    return FormationService(FormationRepository(db))


@router.get("", response_model=FormationListResponse)
def list_formations(
    level: Optional[str] = None,
    service: FormationService = Depends(get_service),
) -> FormationListResponse:
    items = service.list_formations(level=level)
    return FormationListResponse(items=items, total=len(items))


@router.get("/{formation_id}", response_model=FormationResponse)
def get_formation(
    formation_id: int,
    service: FormationService = Depends(get_service),
) -> FormationResponse:
    return service.get_formation(formation_id)


@router.post("", response_model=FormationResponse, status_code=status.HTTP_201_CREATED)
def create_formation(
    req: FormationCreateRequest,
    _: AdminUser = Depends(get_current_admin),
    service: FormationService = Depends(get_service),
) -> FormationResponse:
    created = service.create_formation(req)
    return service.get_formation(created.id)


@router.put("/{formation_id}", response_model=FormationResponse)
def update_formation(
    formation_id: int,
    req: FormationUpdateRequest,
    _: AdminUser = Depends(get_current_admin),
    service: FormationService = Depends(get_service),
) -> FormationResponse:
    updated = service.update_formation(formation_id, req)
    return service.get_formation(updated.id)


@router.delete("/{formation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_formation(
    formation_id: int,
    _: AdminUser = Depends(get_current_admin),
    service: FormationService = Depends(get_service),
) -> None:
    service.delete_formation(formation_id)


@router.post("/import-csv", response_model=CSVImportResultResponse)
async def import_formations_csv(
    file: UploadFile = File(...),
    _: AdminUser = Depends(get_current_admin),
    service: FormationService = Depends(get_service),
) -> CSVImportResultResponse:
    content = await read_bounded_csv_content(file)
    imported, updated, errors = service.import_csv(content)
    return CSVImportResultResponse(
        success=len(errors) == 0,
        imported_count=imported,
        updated_count=updated,
        errors=errors,
    )
