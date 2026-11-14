# 1. Responsabilité : Schémas Pydantic v2 pour la soumission et la lecture des vœux élèves
# 2. Dépendances clés : pydantic, typing
# 3. Mots-clés métier : wish, ranking, choice, submission, validation, preferences

from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class WishItemSchema(BaseModel):
    formation_id: int
    rank: int = Field(..., ge=1, le=10)


class WishDetailResponse(BaseModel):
    id: int
    formation_id: int
    formation_name: str
    formation_domain: str
    rank: int

    model_config = ConfigDict(from_attributes=True)


class WishSubmitRequest(BaseModel):
    wishes: List[WishItemSchema] = Field(..., min_length=2, max_length=10)
