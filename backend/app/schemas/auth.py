# 1. Responsabilité : Schémas Pydantic pour la mire de connexion et l'administration des comptes utilisateurs
# 2. Dépendances clés : pydantic, datetime, typing
# 3. Mots-clés métier : auth_schema, login_request, token_response, admin_user, user_management

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    username_or_email: str = Field(..., description="Email ou identifiant administrateur")
    password: str = Field(..., description="Mot de passe administrateur")


class AdminUserBrief(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class AdminUserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    is_active: bool
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AdminUserCreateRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)


class AdminUserUpdateRequest(BaseModel):
    username: Optional[str] = Field(default=None, min_length=3, max_length=50)
    email: Optional[str] = Field(default=None, min_length=5, max_length=100)
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    is_active: Optional[bool] = None
    password: Optional[str] = Field(default=None, min_length=6, max_length=100)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AdminUserBrief
