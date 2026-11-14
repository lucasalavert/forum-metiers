# 1. Responsabilité : Endpoints REST pour la mire de connexion et la gestion multi-comptes administrateurs
# 2. Dépendances clés : fastapi, sqlalchemy.orm, backend.app.core.security, backend.app.core.rate_limit
# 3. Mots-clés métier : auth_router, login, anti_bruteforce, admin_session, access_token, admin_users_crud

from typing import List
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.exceptions import UnauthorizedAdminError
from backend.app.core.rate_limit import (
    get_client_ip,
    login_account_limiter,
    login_ip_limiter,
)
from backend.app.core.security import get_current_admin
from backend.app.models.config import AdminUser
from backend.app.repositories.admin_user_repo import AdminUserRepository
from backend.app.schemas.auth import (
    AdminUserBrief,
    AdminUserCreateRequest,
    AdminUserResponse,
    AdminUserUpdateRequest,
    LoginRequest,
    TokenResponse,
)
from backend.app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentification Admin"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(AdminUserRepository(db))


@router.post("/login", response_model=TokenResponse)
def login_admin(
    req: LoginRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    """Authentifie un administrateur avec protection anti-bruteforce par IP et par identifiant."""
    client_ip = get_client_ip(request)
    account_key = f"{client_ip}:{req.username_or_email.strip().lower()}"

    login_ip_limiter.check_or_raise(
        client_ip,
        "Trop de tentatives de connexion échouées depuis cette adresse IP. Veuillez patienter.",
    )
    login_account_limiter.check_or_raise(
        account_key,
        "Trop de tentatives de connexion échouées pour ce compte. Veuillez réessayer dans quelques minutes.",
    )

    try:
        token_response = service.login(req)
    except UnauthorizedAdminError:
        login_ip_limiter.record_event(client_ip)
        login_account_limiter.record_event(account_key)
        raise

    login_ip_limiter.reset_key(client_ip)
    login_account_limiter.reset_key(account_key)
    return token_response


@router.get("/me", response_model=AdminUserBrief)
def get_current_admin_profile(current_admin: AdminUser = Depends(get_current_admin)) -> AdminUserBrief:
    """Retourne le profil de l'administrateur connecté."""
    return AdminUserBrief(
        id=current_admin.id,
        username=current_admin.username,
        email=current_admin.email,
        full_name=current_admin.full_name,
        is_active=current_admin.is_active,
    )


@router.get("/users", response_model=List[AdminUserResponse])
def list_admin_users(
    _: AdminUser = Depends(get_current_admin),
    service: AuthService = Depends(get_auth_service),
) -> List[AdminUserResponse]:
    """Liste tous les comptes administrateurs de l'établissement."""
    return service.list_admin_users()


@router.post("/users", response_model=AdminUserResponse, status_code=status.HTTP_201_CREATED)
def create_admin_user(
    req: AdminUserCreateRequest,
    _: AdminUser = Depends(get_current_admin),
    service: AuthService = Depends(get_auth_service),
) -> AdminUserResponse:
    """Crée un nouveau compte administrateur (membre de l'équipe éducative)."""
    return service.create_admin_user(req)


@router.put("/users/{user_id}", response_model=AdminUserResponse)
def update_admin_user(
    user_id: int,
    req: AdminUserUpdateRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    service: AuthService = Depends(get_auth_service),
) -> AdminUserResponse:
    """Met à jour un compte administrateur (infos, statut ou mot de passe)."""
    return service.update_admin_user(user_id, req, current_admin.id)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_user(
    user_id: int,
    current_admin: AdminUser = Depends(get_current_admin),
    service: AuthService = Depends(get_auth_service),
) -> None:
    """Supprime un compte administrateur."""
    service.delete_admin_user(user_id, current_admin.id)
