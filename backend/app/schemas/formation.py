# 1. Responsabilité : Schémas Pydantic v2 pour les formations et intervenants (support jusqu'à 6 rotations)
# 2. Dépendances clés : pydantic, typing
# 3. Mots-clés métier : formation, schemas, validation, capacity, room, levels, rotations

from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class FormationBase(BaseModel):
    code: str = Field(..., max_length=30)
    name: str = Field(..., max_length=150)
    domain: str = Field(..., max_length=100)
    description: str = Field(default="")
    speaker_name: Optional[str] = Field(default="")
    room: Optional[str] = Field(default="Salle standard")
    target_levels: str = Field(default="2NDE,1ERE,TERM")
    capacity_per_rotation: int = Field(default=20, ge=1, le=100)
    active_rotations: str = Field(default="1,2,3,4")


class FormationCreateRequest(FormationBase):
    pass


class FormationUpdateRequest(BaseModel):
    code: Optional[str] = Field(default=None, max_length=30)
    name: Optional[str] = Field(default=None, max_length=150)
    domain: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None)
    speaker_name: Optional[str] = Field(default=None)
    room: Optional[str] = Field(default=None)
    target_levels: Optional[str] = Field(default=None)
    capacity_per_rotation: Optional[int] = Field(default=None, ge=1, le=100)
    active_rotations: Optional[str] = Field(default=None)


class FormationResponse(FormationBase):
    id: int
    wishes_count_rank1: int = 0
    wishes_count_total: int = 0
    assigned_count: int = 0
    occupancy_r1: int = 0
    occupancy_r2: int = 0
    occupancy_r3: int = 0
    occupancy_r4: int = 0
    occupancy_r5: int = 0
    occupancy_r6: int = 0

    model_config = ConfigDict(from_attributes=True)


class FormationListResponse(BaseModel):
    items: List[FormationResponse]
    total: int
    page: int = 1
    size: int = 50
