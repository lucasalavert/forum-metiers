# 1. Responsabilité : Points de terminaison HTTP pour l'accès élève via lien unique avec anti-énumération
# 2. Dépendances clés : fastapi, sqlalchemy.orm, backend.app.core.rate_limit, backend.app.services.*
# 3. Mots-clés métier : portal, student_view, unique_token, anti_enumeration, wishes_submission

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.exceptions import EntityNotFoundError
from backend.app.core.rate_limit import (
    get_client_ip,
    portal_not_found_limiter,
    portal_wishes_limiter,
)
from backend.app.repositories.allocation_repo import AllocationRepository
from backend.app.repositories.formation_repo import FormationRepository
from backend.app.repositories.student_repo import StudentRepository
from backend.app.schemas.student import StudentPortalResponse
from backend.app.schemas.wish import WishSubmitRequest
from backend.app.services.allocation_service import AllocationService
from backend.app.services.student_service import StudentService

router = APIRouter(prefix="/portal", tags=["Portal"])


def get_student_service(db: Session = Depends(get_db)) -> StudentService:
    return StudentService(StudentRepository(db), FormationRepository(db))


def get_allocation_service(db: Session = Depends(get_db)) -> AllocationService:
    return AllocationService(AllocationRepository(db), FormationRepository(db), StudentRepository(db))


@router.get("/{token}", response_model=StudentPortalResponse)
def get_student_portal(
    token: str,
    request: Request,
    service: StudentService = Depends(get_student_service),
) -> StudentPortalResponse:
    client_ip = get_client_ip(request)
    portal_not_found_limiter.check_or_raise(
        client_ip,
        "Trop de tentatives d'accès à des liens élèves introuvables. Veuillez patienter avant de réessayer.",
    )
    try:
        return service.get_student_by_token(token)
    except EntityNotFoundError:
        portal_not_found_limiter.record_event(client_ip)
        raise


@router.put("/{token}/wishes", response_model=StudentPortalResponse)
def submit_wishes(
    token: str,
    req: WishSubmitRequest,
    request: Request,
    alloc_service: AllocationService = Depends(get_allocation_service),
    student_service: StudentService = Depends(get_student_service),
) -> StudentPortalResponse:
    client_ip = get_client_ip(request)
    portal_not_found_limiter.check_or_raise(
        client_ip,
        "Trop de tentatives d'accès à des liens élèves introuvables. Veuillez patienter avant de réessayer.",
    )
    portal_wishes_limiter.check_or_raise(
        client_ip,
        "Trop de soumissions de vœux rapprochées depuis cette adresse IP. Veuillez patienter.",
    )
    portal_wishes_limiter.record_event(client_ip)

    try:
        alloc_service.submit_student_wishes(token, req)
        return student_service.get_student_by_token(token)
    except EntityNotFoundError:
        portal_not_found_limiter.record_event(client_ip)
        raise
