# 1. Responsabilité : Protection anti-bruteforce et anti-énumération par fenêtre glissante en mémoire
# 2. Dépendances clés : time, collections, fastapi, backend.app.core.exceptions
# 3. Mots-clés métier : rate_limit, anti_bruteforce, anti_enumeration, sliding_window, client_ip

import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, UploadFile
from backend.app.core.exceptions import DomainException, RateLimitExceededError

MAX_CSV_UPLOAD_BYTES = 2 * 1024 * 1024  # 2 Mo max par fichier CSV


def get_client_ip(request: Request) -> str:
    """Extrait l'adresse IP réelle du client (compatible Traefik / Nginx / Apache)."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        first_ip = forwarded_for.split(",")[0].strip()
        if first_ip:
            return first_ip
    real_ip = request.headers.get("x-real-ip")
    if real_ip and real_ip.strip():
        return real_ip.strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


async def read_bounded_csv_content(file: UploadFile, max_bytes: int = MAX_CSV_UPLOAD_BYTES) -> str:
    """Lit un fichier CSV uploadé en vérifiant qu'il ne dépasse pas la taille maximale autorisée."""
    raw = await file.read(max_bytes + 1)
    if len(raw) > max_bytes:
        raise DomainException(
            "Le fichier CSV dépasse la taille maximale autorisée (2 Mo).",
            code="CSV_FILE_TOO_LARGE",
        )
    return raw.decode("utf-8-sig", errors="replace")


class SlidingWindowLimiter:
    """Limiteur de débit en mémoire à fenêtre glissante avec blocage temporaire."""

    def __init__(self, max_events: int, window_seconds: int, block_seconds: int) -> None:
        self.max_events = max_events
        self.window_seconds = window_seconds
        self.block_seconds = block_seconds
        self._events: Dict[str, List[float]] = defaultdict(list)
        self._blocked_until: Dict[str, float] = {}

    def _prune(self, key: str, now: float) -> None:
        cutoff = now - self.window_seconds
        events = self._events.get(key)
        if events:
            self._events[key] = [t for t in events if t > cutoff]
            if not self._events[key]:
                self._events.pop(key, None)
        blocked_until = self._blocked_until.get(key)
        if blocked_until is not None and now >= blocked_until:
            self._blocked_until.pop(key, None)

    def check_or_raise(self, key: str, error_message: str) -> None:
        now = time.monotonic()
        self._prune(key, now)
        blocked_until = self._blocked_until.get(key)
        if blocked_until is not None and now < blocked_until:
            retry_after = max(1, int(blocked_until - now))
            raise RateLimitExceededError(message=error_message, retry_after=retry_after)

        events = self._events.get(key, [])
        if len(events) >= self.max_events:
            self._blocked_until[key] = now + self.block_seconds
            raise RateLimitExceededError(message=error_message, retry_after=self.block_seconds)

    def record_event(self, key: str) -> None:
        now = time.monotonic()
        self._prune(key, now)
        self._events[key].append(now)
        if len(self._events[key]) >= self.max_events:
            self._blocked_until[key] = now + self.block_seconds

    def reset_key(self, key: str) -> None:
        self._events.pop(key, None)
        self._blocked_until.pop(key, None)

    def clear_all(self) -> None:
        self._events.clear()
        self._blocked_until.clear()


# Instances partagées de protection
login_ip_limiter = SlidingWindowLimiter(max_events=10, window_seconds=600, block_seconds=600)
login_account_limiter = SlidingWindowLimiter(max_events=5, window_seconds=600, block_seconds=600)
portal_not_found_limiter = SlidingWindowLimiter(max_events=15, window_seconds=300, block_seconds=600)
portal_wishes_limiter = SlidingWindowLimiter(max_events=30, window_seconds=300, block_seconds=300)


def reset_all_rate_limiters() -> None:
    """Réinitialise tous les compteurs (utile pour l'isolation des tests)."""
    login_ip_limiter.clear_all()
    login_account_limiter.clear_all()
    portal_not_found_limiter.clear_all()
    portal_wishes_limiter.clear_all()
