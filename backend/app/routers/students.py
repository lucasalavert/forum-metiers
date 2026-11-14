# 1. Responsabilité : Points de terminaison HTTP protégés (JWT) pour la gestion des élèves et des classes
# 2. Dépendances clés : fastapi, sqlalchemy.orm, backend.app.core.security, backend.app.services.student_service
# 3. Mots-clés métier : students, classes, unique_token, admin_protected, specialty_config, csv_import

from typing import List, Optional
from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.rate_limit import read_bounded_csv_content
from backend.app.core.security import get_current_admin
from backend.app.repositories.formation_repo import FormationRepository
from backend.app.repositories.student_repo import StudentRepository
from backend.app.schemas.allocation import CSVImportResultResponse
from backend.app.schemas.student import (
    ClassConfigResponse,
    ClassConfigUpdateRequest,
    StudentCreateRequest,
    StudentListResponse,
    StudentResponse,
    StudentUpdateRequest,
)
from backend.app.services.student_service import StudentService

router = APIRouter(
    prefix="/students",
    tags=["Students"],
    dependencies=[Depends(get_current_admin)],
)


def get_service(db: Session = Depends(get_db)) -> StudentService:
    return StudentService(StudentRepository(db), FormationRepository(db))


@router.get("", response_model=StudentListResponse)
def list_students(
    level: Optional[str] = Query(default=None),
    class_name: Optional[str] = Query(default=None),
    has_wishes: Optional[bool] = Query(default=None),
    search: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=50, ge=1, le=1000),
    service: StudentService = Depends(get_service),
) -> StudentListResponse:
    items, total = service.list_students(
        level=level,
        class_name=class_name,
        has_wishes=has_wishes,
        search=search,
        page=page,
        size=size,
    )
    return StudentListResponse(items=items, total=total, page=page, size=size)


@router.get("/class-configs", response_model=List[ClassConfigResponse])
def list_class_configs(
    service: StudentService = Depends(get_service),
) -> List[ClassConfigResponse]:
    return service.list_class_configs()


@router.put("/class-configs/{class_name}", response_model=ClassConfigResponse)
def update_class_specialty_rotations(
    class_name: str,
    req: ClassConfigUpdateRequest,
    service: StudentService = Depends(get_service),
) -> ClassConfigResponse:
    return service.update_class_specialty_rotations(class_name, req.specialty_rotations)


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    service: StudentService = Depends(get_service),
) -> StudentResponse:
    return service.get_student(student_id)


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    req: StudentCreateRequest,
    service: StudentService = Depends(get_service),
) -> StudentResponse:
    created = service.create_student(req)
    return service.get_student(created.id)


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    req: StudentUpdateRequest,
    service: StudentService = Depends(get_service),
) -> StudentResponse:
    updated = service.update_student(student_id, req)
    return service.get_student(updated.id)


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: int,
    service: StudentService = Depends(get_service),
) -> None:
    service.delete_student(student_id)


@router.post("/import-csv", response_model=CSVImportResultResponse)
async def import_students_csv(
    file: UploadFile = File(...),
    service: StudentService = Depends(get_service),
) -> CSVImportResultResponse:
    content = await read_bounded_csv_content(file)
    imported, updated, errors = service.import_csv(content)
    return CSVImportResultResponse(
        success=len(errors) == 0,
        imported_count=imported,
        updated_count=updated,
        errors=errors,
    )


@router.post("/import-wishes-csv", response_model=CSVImportResultResponse)
async def import_wishes_csv(
    file: UploadFile = File(...),
    service: StudentService = Depends(get_service),
) -> CSVImportResultResponse:
    content = await read_bounded_csv_content(file)
    wishes_imported, students_updated, errors = service.import_wishes_csv(content)
    return CSVImportResultResponse(
        success=len(errors) == 0,
        imported_count=wishes_imported,
        updated_count=students_updated,
        errors=errors,
    )


@router.post("/{student_id}/regenerate-token", response_model=StudentResponse)
def regenerate_student_token(
    student_id: int,
    service: StudentService = Depends(get_service),
) -> StudentResponse:
    return service.regenerate_student_token(student_id)


@router.post("/regenerate-all-tokens")
def regenerate_all_tokens(
    service: StudentService = Depends(get_service),
) -> dict[str, int]:
    count = service.regenerate_all_tokens()
    return {"updated_count": count}
