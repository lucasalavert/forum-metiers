# 1. Responsabilité : Initialisation SQLAlchemy, migrations idempotentes et dépendance de session
# 2. Dépendances clés : sqlalchemy, app.core.config, typing
# 3. Mots-clés métier : database, engine, session, orm, sqlite, schema_migration, dependency_injection

import os
from typing import Generator
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.app.core.config import get_settings

settings = get_settings()

if settings.database_url.startswith("sqlite:///"):
    sqlite_path = settings.database_url.replace("sqlite:///", "", 1)
    dir_name = os.path.dirname(sqlite_path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

_EVENT_CONFIG_EXTRA_COLUMNS: tuple[tuple[str, str], ...] = (
    ("school_name", "VARCHAR(200) NOT NULL DEFAULT 'Lycée Général et Technologique'"),
    ("school_subtitle", "VARCHAR(200) NOT NULL DEFAULT 'Forum de l''Orientation'"),
    ("school_logo_url", "TEXT NOT NULL DEFAULT ''"),
    ("school_website_url", "VARCHAR(300) NOT NULL DEFAULT ''"),
    ("ent_name", "VARCHAR(100) NOT NULL DEFAULT 'Pronote / ÉcoleDirecte'"),
    ("home_access_instructions", "TEXT NOT NULL DEFAULT ''"),
    ("theme_primary_color", "VARCHAR(20) NOT NULL DEFAULT '#272154'"),
    ("theme_secondary_color", "VARCHAR(20) NOT NULL DEFAULT '#312783'"),
    ("theme_accent_color", "VARCHAR(20) NOT NULL DEFAULT '#EB5E57'"),
    ("rotations_count", "INTEGER NOT NULL DEFAULT 4"),
    ("seconde_specialty_slots", "INTEGER NOT NULL DEFAULT 2"),
    ("r5_start", "VARCHAR(5) NOT NULL DEFAULT '13:30'"),
    ("r5_end", "VARCHAR(5) NOT NULL DEFAULT '14:20'"),
    ("r6_start", "VARCHAR(5) NOT NULL DEFAULT '14:30'"),
    ("r6_end", "VARCHAR(5) NOT NULL DEFAULT '15:20'"),
)


def ensure_schema_migrations(target_engine: Engine = engine) -> None:
    """Ajoute de manière idempotente les colonnes de marque blanche, thème et rotations sur une base SQLite existante."""
    inspector = inspect(target_engine)
    if "event_config" not in inspector.get_table_names():
        return

    existing_cols = {col["name"] for col in inspector.get_columns("event_config")}
    missing = [
        (col_name, ddl)
        for col_name, ddl in _EVENT_CONFIG_EXTRA_COLUMNS
        if col_name not in existing_cols
    ]
    if not missing:
        return

    with target_engine.begin() as conn:
        for col_name, ddl in missing:
            conn.execute(text(f"ALTER TABLE event_config ADD COLUMN {col_name} {ddl}"))


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
