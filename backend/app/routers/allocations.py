# 1. Responsabilité : Points de terminaison HTTP protégés (JWT) pour l'exécution du solveur et l'arbitrage
# 2. Dépendances clés : fastapi, sqlalchemy.orm, backend.app.core.security, backend.app.services.allocation_service
# 3. Mots-clés métier : allocations, solver, run, stats, heatmap, arbitrage, lock, admin_protected

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import get_current_admin
from backend.app.repositories.allocation_repo import AllocationRepository
from backend.app.repositories.formation_repo import FormationRepository
from backend.app.repositories.student_repo import StudentRepository
from backend.app.schemas.allocation import (
    AllocationRunRequest,
    AllocationStatsResponse,
    AssignmentManualUpdateRequest,
)
from backend.app.schemas.student import AssignmentBriefResponse
from backend.app.services.allocation_service import AllocationService

router = APIRouter(
    prefix="/allocations",
    tags=["Allocations"],
    dependencies=[Depends(get_current_admin)],
)


def get_service(db: Session = Depends(get_db)) -> AllocationService:
    return AllocationService(
        AllocationRepository(db),
        FormationRepository(db),
        StudentRepository(db),
    )


@router.get("/analysis", response_model=AllocationStatsResponse)
def get_allocation_analysis(
    service: AllocationService = Depends(get_service),
) -> AllocationStatsResponse:
    return service.get_stats()


@router.post("/run", response_model=AllocationStatsResponse)
def run_allocation(
    req: AllocationRunRequest,
    service: AllocationService = Depends(get_service),
) -> AllocationStatsResponse:
    return service.run_allocation(req)


@router.put("/assignments", response_model=AssignmentBriefResponse)
def update_assignment_manual(
    req: AssignmentManualUpdateRequest,
    service: AllocationService = Depends(get_service),
) -> AssignmentBriefResponse:
    return service.update_assignment_manual(req)
