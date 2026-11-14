# 1. Responsabilité : Schémas Pydantic v2 pour les élèves, leurs tokens et configurations de classe
# 2. Dépendances clés : pydantic, typing, datetime, backend.app.schemas.wish
# 3. Mots-clés métier : student, class_config, token, wishes, portal, schedule, assignments

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from backend.app.schemas.wish import WishDetailResponse


class StudentBase(BaseModel):
    first_name: str = Field(..., max_length=80)
    last_name: str = Field(..., max_length=80)
    class_name: str = Field(..., max_length=40)
    level: str = Field(..., max_length=20)
    email: Optional[str] = Field(default=None, max_length=160)


class StudentCreateRequest(StudentBase):
    pass


class StudentUpdateRequest(BaseModel):
    first_name: Optional[str] = Field(default=None, max_length=80)
    last_name: Optional[str] = Field(default=None, max_length=80)
    class_name: Optional[str] = Field(default=None, max_length=40)
    level: Optional[str] = Field(default=None, max_length=20)
    email: Optional[str] = Field(default=None, max_length=160)


class AssignmentBriefResponse(BaseModel):
    rotation: int
    assignment_type: str
    formation_id: Optional[int] = None
    formation_name: Optional[str] = None
    formation_room: Optional[str] = None
    speaker_name: Optional[str] = None
    wish_rank_obtained: Optional[int] = None
    is_locked: bool = False

    model_config = ConfigDict(from_attributes=True)


class StudentResponse(StudentBase):
    id: int
    token: str
    wishes_submitted_at: Optional[datetime] = None
    wishes_count: int = 0
    assignments: List[AssignmentBriefResponse] = []

    model_config = ConfigDict(from_attributes=True)


class StudentListResponse(BaseModel):
    items: List[StudentResponse]
    total: int
    page: int = 1
    size: int = 50


class ClassConfigResponse(BaseModel):
    id: int
    class_name: str
    level: str
    specialty_rotations: str
    students_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class ClassConfigUpdateRequest(BaseModel):
    specialty_rotations: str = Field(..., pattern=r"^(AUTO|1,2|3,4|1,3|2,4|1,4|2,3)$")


class StudentPortalResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    class_name: str
    level: str
    required_wishes_count: int
    required_formations_count: int
    has_specialty_rotations: bool
    specialty_rotations_label: str
    wishes_submitted_at: Optional[datetime] = None
    wishes: List[WishDetailResponse] = []
    assignments: List[AssignmentBriefResponse] = []
