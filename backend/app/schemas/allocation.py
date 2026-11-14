# 1. Responsabilité : Schémas Pydantic v2 pour le solveur de répartition, statistiques de tension et arbitrages
# 2. Dépendances clés : pydantic, typing
# 3. Mots-clés métier : allocation, solver, tension, satisfaction, heatmap, arbitrage, lock

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class AllocationRunRequest(BaseModel):
    auto_fill_missing: bool = Field(default=True)
    respect_locks: bool = Field(default=True)


class AssignmentManualUpdateRequest(BaseModel):
    student_id: int
    rotation: int = Field(..., ge=1, le=6)
    formation_id: Optional[int] = None
    assignment_type: str = Field(default="FORMATION", pattern=r"^(FORMATION|SPECIALTY)$")
    is_locked: bool = True


class SatisfactionBreakdown(BaseModel):
    rank_1_count: int = 0
    rank_2_count: int = 0
    rank_3_count: int = 0
    rank_4_plus_count: int = 0
    unassigned_or_fallback_count: int = 0
    specialty_count: int = 0
    total_assignments: int = 0
    satisfaction_rate_percent: float = 0.0


class FormationTensionItem(BaseModel):
    formation_id: int
    code: str
    name: str
    domain: str
    capacity_total: int
    wishes_rank1: int
    wishes_total: int
    tension_ratio: float
    assigned_total: int
    occupancy_r1: int
    occupancy_r2: int
    occupancy_r3: int
    occupancy_r4: int
    occupancy_r5: int = 0
    occupancy_r6: int = 0


class AllocationStatsResponse(BaseModel):
    total_students: int
    students_with_wishes: int
    students_without_wishes: int = 0
    students_pending_allocation: int = 0
    students_fully_allocated: int = 0
    unassigned_wishes_total: int = 0
    response_rate_percent: float
    total_formations: int
    total_seats_capacity: int
    total_assigned_seats: int
    overall_fill_rate_percent: float
    satisfaction: SatisfactionBreakdown
    tensions: List[FormationTensionItem]
    rotations_occupancy: Dict[str, int]


class CSVImportResultResponse(BaseModel):
    success: bool
    imported_count: int
    updated_count: int
    errors: List[str] = []
