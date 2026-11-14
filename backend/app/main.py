# 1. Responsabilité : Point d'entrée de l'application FastAPI, middlewares de sécurité, gestionnaires d'erreurs et routage
# 2. Dépendances clés : fastapi, fastapi.middleware.cors, fastapi.staticfiles, backend.app.core.*, backend.app.routers.*
# 3. Mots-clés métier : main, app, fastapi, bootstrap, security_headers, rate_limit, exception_handlers, routers

import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from backend.app.core.config import get_settings
from backend.app.core.database import Base, SessionLocal, engine, ensure_schema_migrations
from backend.app.core.exceptions import (
    DomainException,
    EntityNotFoundError,
    ForbiddenOperationError,
    InvalidWishesError,
    QuotaExceededError,
    RateLimitExceededError,
    UnauthorizedAdminError,
)
from backend.app.repositories.admin_user_repo import AdminUserRepository
from backend.app.repositories.config_repo import ConfigRepository
from backend.app.routers.allocations import router as allocations_router
from backend.app.routers.auth import router as auth_router
from backend.app.routers.config import router as config_router
from backend.app.routers.formations import router as formations_router
from backend.app.routers.portal import router as portal_router
from backend.app.routers.students import router as students_router
from backend.app.services.auth_service import AuthService

# Création automatique des tables si nécessaires et migrations incrémentales
Base.metadata.create_all(bind=engine)
ensure_schema_migrations(engine)

settings = get_settings()
is_prod = settings.app_env.lower() == "production"

# Initialisation du compte administrateur et de la configuration par défaut
try:
    with SessionLocal() as init_db:
        AuthService(AdminUserRepository(init_db)).ensure_default_admin()
        ConfigRepository(init_db).get_or_create_config()
except Exception:
    pass

app = FastAPI(
    title="Plateforme Forum des Métiers & de l'Orientation",
    description="API de collecte des vœux, gestion des formations et répartition automatisée.",
    version="1.1.0",
    docs_url=None if is_prod else "/docs",
    redoc_url=None if is_prod else "/redoc",
    openapi_url=None if is_prod else "/openapi.json",
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.app_env == "development" else settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# Gestionnaires normalisés d'exceptions
@app.exception_handler(EntityNotFoundError)
async def entity_not_found_handler(request: Request, exc: EntityNotFoundError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"error": exc.code, "message": exc.message, "details": exc.details},
    )


@app.exception_handler(QuotaExceededError)
async def quota_exceeded_handler(request: Request, exc: QuotaExceededError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"error": exc.code, "message": exc.message, "details": exc.details},
    )


@app.exception_handler(InvalidWishesError)
async def invalid_wishes_handler(request: Request, exc: InvalidWishesError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": exc.code, "message": exc.message, "details": exc.details},
    )


@app.exception_handler(UnauthorizedAdminError)
async def unauthorized_admin_handler(request: Request, exc: UnauthorizedAdminError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"error": exc.code, "message": exc.message},
    )


@app.exception_handler(ForbiddenOperationError)
async def forbidden_operation_handler(request: Request, exc: ForbiddenOperationError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"error": exc.code, "message": exc.message},
    )


@app.exception_handler(RateLimitExceededError)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceededError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        headers={"Retry-After": str(exc.retry_after)},
        content={"error": exc.code, "message": exc.message, "details": exc.details},
    )


@app.exception_handler(DomainException)
async def domain_exception_handler(request: Request, exc: DomainException) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"error": exc.code, "message": exc.message, "details": exc.details},
    )


# Inclusion des sous-routeurs d'API REST
api_prefix = "/api/v1"
app.include_router(auth_router, prefix=api_prefix)
app.include_router(config_router, prefix=api_prefix)
app.include_router(formations_router, prefix=api_prefix)
app.include_router(students_router, prefix=api_prefix)
app.include_router(portal_router, prefix=api_prefix)
app.include_router(allocations_router, prefix=api_prefix)


@app.get("/api/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "forum-orientation-api"}


# Support pour servir le frontend compilé avec fallback SPA HTML5
frontend_dist_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
)
assets_path = os.path.join(frontend_dist_path, "assets")

if os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
async def spa_fallback(full_path: str):
    target_file = os.path.abspath(os.path.join(frontend_dist_path, full_path))
    if target_file.startswith(frontend_dist_path) and os.path.isfile(target_file):
        return FileResponse(target_file)
    index_file = os.path.join(frontend_dist_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"error": "Not Found", "message": f"Route '{full_path}' introuvable."},
    )
