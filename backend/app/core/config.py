# 1. Responsabilité : Paramètres de configuration globaux et valeurs par défaut de marque blanche
# 2. Dépendances clés : pydantic_settings, typing, functools
# 3. Mots-clés métier : settings, configuration, database, environment, security, white_label, cors

from functools import lru_cache
from typing import List
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = Field(default="development", alias="APP_ENV")
    app_port: int = Field(default=8190, alias="APP_PORT")
    database_url: str = Field(default="sqlite:///./forum_metiers.db", alias="DATABASE_URL")
    cors_origins: List[str] = Field(
        default=["http://localhost:5190", "http://127.0.0.1:5190", "http://localhost:8190"],
        alias="CORS_ORIGINS"
    )
    admin_secret_key: str = Field(
        default="forum_metiers_dev_key_change_in_prod",
        alias="ADMIN_SECRET_KEY"
    )
    student_token_salt: str = Field(
        default="forum_metiers_student_portal_hmac_salt_2027",
        alias="STUDENT_TOKEN_SALT"
    )
    admin_pin: str = Field(default="2027", alias="ADMIN_PIN")
    admin_username: str = Field(default="admin", alias="ADMIN_USERNAME")
    admin_email: str = Field(default="admin@etablissement.fr", alias="ADMIN_EMAIL")
    admin_password: str = Field(
        default="AdminForum2027!",
        validation_alias=AliasChoices("ADMIN_PASSWORD", "ADMIN_DEFAULT_PASSWORD")
    )
    default_formation_capacity: int = Field(default=20, alias="DEFAULT_FORMATION_CAPACITY")
    default_school_name: str = Field(
        default="Lycée Général et Technologique",
        alias="DEFAULT_SCHOOL_NAME"
    )
    default_school_subtitle: str = Field(default="Forum de l'Orientation", alias="DEFAULT_SCHOOL_SUBTITLE")
    default_school_website_url: str = Field(
        default="",
        alias="DEFAULT_SCHOOL_WEBSITE_URL"
    )
    default_ent_name: str = Field(default="Pronote / ÉcoleDirecte", alias="DEFAULT_ENT_NAME")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()
