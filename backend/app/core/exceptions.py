# 1. Responsabilité : Exceptions métier, de sécurité et de limitation de débit pour la plateforme
# 2. Dépendances clés : typing
# 3. Mots-clés métier : exceptions, domain_error, not_found, quota_exceeded, rate_limit, forbidden

from typing import Any, Optional


class DomainException(Exception):
    def __init__(self, message: str, code: str = "DOMAIN_ERROR", details: Optional[Any] = None) -> None:
        self.message = message
        self.code = code
        self.details = details
        super().__init__(message)


class EntityNotFoundError(DomainException):
    def __init__(self, entity: str, identifier: Any) -> None:
        super().__init__(
            message=f"{entity} '{identifier}' introuvable.",
            code="NOT_FOUND",
            details={"entity": entity, "identifier": identifier},
        )


class QuotaExceededError(DomainException):
    def __init__(self, formation_id: int, rotation: int, capacity: int) -> None:
        super().__init__(
            message=f"La formation #{formation_id} a atteint sa capacité maximale ({capacity}) en rotation {rotation}.",
            code="QUOTA_EXCEEDED",
            details={"formation_id": formation_id, "rotation": rotation, "capacity": capacity},
        )


class InvalidWishesError(DomainException):
    def __init__(self, reason: str, details: Optional[Any] = None) -> None:
        super().__init__(
            message=f"Vœux invalides : {reason}",
            code="INVALID_WISHES",
            details=details,
        )


class UnauthorizedAdminError(DomainException):
    def __init__(self, message: str = "Accès administrateur non autorisé.") -> None:
        super().__init__(message=message, code="UNAUTHORIZED_ADMIN")


class ForbiddenOperationError(DomainException):
    def __init__(self, message: str, code: str = "FORBIDDEN_OPERATION") -> None:
        super().__init__(message=message, code=code)


class RateLimitExceededError(DomainException):
    def __init__(self, message: str, retry_after: int = 60) -> None:
        self.retry_after = retry_after
        super().__init__(
            message=message,
            code="RATE_LIMIT_EXCEEDED",
            details={"retry_after_seconds": retry_after},
        )
