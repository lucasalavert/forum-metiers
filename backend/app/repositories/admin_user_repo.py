# 1. Responsabilité : Persistance et gestion des comptes utilisateurs administrateurs
# 2. Dépendances clés : sqlalchemy.orm, datetime, backend.app.models.config
# 3. Mots-clés métier : admin_repo, user_lookup, credentials, last_login, multi_accounts

from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models.config import AdminUser


class AdminUserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[AdminUser]:
        return self.db.query(AdminUser).filter(AdminUser.id == user_id).first()

    def get_by_username_or_email(self, identifier: str) -> Optional[AdminUser]:
        clean = identifier.strip().lower()
        return (
            self.db.query(AdminUser)
            .filter((AdminUser.username == clean) | (AdminUser.email == clean))
            .first()
        )

    def list_all(self) -> List[AdminUser]:
        return self.db.query(AdminUser).order_by(AdminUser.id.asc()).all()

    def count_active(self) -> int:
        return self.db.query(AdminUser).filter(AdminUser.is_active == True).count()

    def create_admin_user(
        self,
        username: str,
        email: str,
        password_hash: str,
        salt: str,
        full_name: str,
    ) -> AdminUser:
        user = AdminUser(
            username=username.strip().lower(),
            email=email.strip().lower(),
            password_hash=password_hash,
            salt=salt,
            full_name=full_name.strip(),
            is_active=True,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_user(self, user: AdminUser) -> AdminUser:
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete_user(self, user: AdminUser) -> None:
        self.db.delete(user)
        self.db.commit()

    def update_last_login(self, user: AdminUser) -> None:
        user.last_login = datetime.now(timezone.utc)
        self.db.commit()
