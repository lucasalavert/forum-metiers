# 1. Responsabilité : Service d'authentification et gestion multi-comptes administrateurs
# 2. Dépendances clés : backend.app.core.security, backend.app.repositories.admin_user_repo, backend.app.schemas.auth
# 3. Mots-clés métier : auth_service, login, admin_users, password_hash, access_token

from typing import List
from backend.app.core.config import get_settings
from backend.app.core.exceptions import DomainException, EntityNotFoundError, UnauthorizedAdminError
from backend.app.core.security import (
    create_access_token,
    generate_salt,
    hash_password,
    verify_password,
)
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


class AuthService:
    def __init__(self, admin_repo: AdminUserRepository) -> None:
        self.repo = admin_repo

    def login(self, req: LoginRequest) -> TokenResponse:
        user = self.repo.get_by_username_or_email(req.username_or_email)
        if not user or not user.is_active:
            raise UnauthorizedAdminError("Identifiant ou mot de passe incorrect.")

        if not verify_password(req.password, user.password_hash, user.salt):
            raise UnauthorizedAdminError("Identifiant ou mot de passe incorrect.")

        self.repo.update_last_login(user)
        token = create_access_token(user.id, user.username)

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user=AdminUserBrief(
                id=user.id,
                username=user.username,
                email=user.email,
                full_name=user.full_name,
                is_active=user.is_active,
            ),
        )

    def list_admin_users(self) -> List[AdminUserResponse]:
        users = self.repo.list_all()
        return [AdminUserResponse.model_validate(u) for u in users]

    def create_admin_user(self, req: AdminUserCreateRequest) -> AdminUserResponse:
        existing = self.repo.get_by_username_or_email(req.username)
        if existing:
            raise DomainException(f"L'identifiant '{req.username}' est déjà utilisé.", code="DUPLICATE_USERNAME")
        existing_email = self.repo.get_by_username_or_email(req.email)
        if existing_email:
            raise DomainException(f"L'adresse email '{req.email}' est déjà utilisée.", code="DUPLICATE_EMAIL")

        salt = generate_salt()
        pwd_hash = hash_password(req.password, salt)
        created = self.repo.create_admin_user(
            username=req.username,
            email=req.email,
            password_hash=pwd_hash,
            salt=salt,
            full_name=req.full_name,
        )
        return AdminUserResponse.model_validate(created)

    def update_admin_user(
        self,
        user_id: int,
        req: AdminUserUpdateRequest,
        current_admin_id: int,
    ) -> AdminUserResponse:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise EntityNotFoundError("AdminUser", user_id)

        if req.is_active is False and user.id == current_admin_id:
            raise DomainException(
                "Vous ne pouvez pas désactiver votre propre compte administrateur.",
                code="CANNOT_DEACTIVATE_SELF",
            )

        if req.is_active is False and user.is_active and self.repo.count_active() <= 1:
            raise DomainException(
                "Impossible de désactiver le dernier compte administrateur actif.",
                code="LAST_ACTIVE_ADMIN",
            )

        if req.username is not None and req.username.strip():
            clean_u = req.username.strip().lower()
            if clean_u != user.username:
                existing = self.repo.get_by_username_or_email(clean_u)
                if existing and existing.id != user.id:
                    raise DomainException(f"L'identifiant '{clean_u}' est déjà pris.", code="DUPLICATE_USERNAME")
                user.username = clean_u

        if req.email is not None and req.email.strip():
            clean_e = req.email.strip().lower()
            if clean_e != user.email:
                existing = self.repo.get_by_username_or_email(clean_e)
                if existing and existing.id != user.id:
                    raise DomainException(f"L'email '{clean_e}' est déjà pris.", code="DUPLICATE_EMAIL")
                user.email = clean_e

        if req.full_name is not None and req.full_name.strip():
            user.full_name = req.full_name.strip()

        if req.is_active is not None:
            user.is_active = req.is_active

        if req.password is not None and req.password.strip():
            new_salt = generate_salt()
            user.salt = new_salt
            user.password_hash = hash_password(req.password.strip(), new_salt)

        updated = self.repo.update_user(user)
        return AdminUserResponse.model_validate(updated)

    def delete_admin_user(self, user_id: int, current_admin_id: int) -> None:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise EntityNotFoundError("AdminUser", user_id)

        if user.id == current_admin_id:
            raise DomainException(
                "Vous ne pouvez pas supprimer votre propre compte administrateur.",
                code="CANNOT_DELETE_SELF",
            )

        if self.repo.count_active() <= 1 and user.is_active:
            raise DomainException(
                "Impossible de supprimer le dernier compte administrateur actif.",
                code="LAST_ACTIVE_ADMIN",
            )

        self.repo.delete_user(user)

    def ensure_default_admin(self) -> AdminUser:
        settings = get_settings()
        admin = self.repo.get_by_username_or_email(settings.admin_username) or self.repo.get_by_username_or_email(settings.admin_email)

        if not admin:
            salt = generate_salt()
            pwd_hash = hash_password(settings.admin_password, salt)
            admin = self.repo.create_admin_user(
                username=settings.admin_username,
                email=settings.admin_email,
                password_hash=pwd_hash,
                salt=salt,
                full_name="Direction Établissement",
            )
        else:
            if not verify_password(settings.admin_password, admin.password_hash, admin.salt):
                new_salt = generate_salt()
                admin.salt = new_salt
                admin.password_hash = hash_password(settings.admin_password, new_salt)
                admin.is_active = True
                self.repo.update_user(admin)
        return admin
