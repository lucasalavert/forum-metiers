# 1. Responsabilité : Utilitaires cryptographiques de hachage de mot de passe et validation des jetons de session
# 2. Dépendances clés : hashlib, hmac, secrets, time, fastapi, backend.app.core.config, backend.app.core.exceptions
# 3. Mots-clés métier : security, pbkdf2, hmac_token, auth_dependency, admin_guard

import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Optional
from fastapi import Depends, Header
from sqlalchemy.orm import Session
from backend.app.core.config import get_settings
from backend.app.core.database import get_db
from backend.app.core.exceptions import UnauthorizedAdminError
from backend.app.models.config import AdminUser

TOKEN_EXPIRATION_SECONDS = 7 * 24 * 3600  # 7 jours


def generate_salt() -> str:
    return secrets.token_hex(16)


def generate_student_token(seed_key: str = "", deterministic: bool = False) -> str:
    settings = get_settings()
    salt = settings.student_token_salt.encode("utf-8")
    if deterministic and seed_key:
        digest = hmac.new(salt, seed_key.encode("utf-8"), hashlib.sha256).hexdigest()
    else:
        nonce = secrets.token_hex(16)
        raw = f"{seed_key}:{nonce}" if seed_key else nonce
        digest = hmac.new(salt, raw.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"sp-{digest[:20]}"


def hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000).hex()


def verify_password(plain_password: str, hashed_password: str, salt: str) -> bool:
    candidate = hash_password(plain_password, salt)
    return hmac.compare_digest(candidate, hashed_password)


def create_access_token(user_id: int, username: str) -> str:
    settings = get_settings()
    now = int(time.time())
    payload = {
        "uid": user_id,
        "sub": username,
        "iat": now,
        "exp": now + TOKEN_EXPIRATION_SECONDS,
    }
    raw_payload = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    b64_payload = base64.urlsafe_b64encode(raw_payload).decode("utf-8").rstrip("=")
    sig = hmac.new(settings.admin_secret_key.encode("utf-8"), b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{b64_payload}.{sig}"


def verify_access_token(token: str) -> Optional[dict]:
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        b64_payload, sig = parts
        settings = get_settings()
        expected_sig = hmac.new(settings.admin_secret_key.encode("utf-8"), b64_payload.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return None

        padding = "=" * (4 - len(b64_payload) % 4) if len(b64_payload) % 4 != 0 else ""
        raw_json = base64.urlsafe_b64decode((b64_payload + padding).encode("utf-8")).decode("utf-8")
        payload = json.loads(raw_json)
        if payload.get("exp", 0) < int(time.time()):
            return None
        return payload
    except Exception:
        return None


def get_current_admin(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> AdminUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedAdminError("Jeton d'authentification manquant ou invalide.")
    token = authorization.split("Bearer ")[1].strip()
    payload = verify_access_token(token)
    if not payload:
        raise UnauthorizedAdminError("Session administrateur expirée ou invalide.")

    user = db.query(AdminUser).filter(AdminUser.id == payload.get("uid")).first()
    if not user or not user.is_active:
        raise UnauthorizedAdminError("Compte administrateur inactif ou introuvable.")
    return user
