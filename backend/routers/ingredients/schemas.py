
import datetime
from pydantic import BaseModel
from typing import Optional, List, Tuple
from datetime import date


class UserIngredientResponse(BaseModel):
    id: int
    name: str
    add_date: date
    expire_date: Optional[date]


class IngredientResponse(BaseModel):
    id: int
    name: str


class IngredientAddForm(BaseModel):
    name: str
    add_date: date
    expire_date: Optional[date]


class IngredientEditForm(BaseModel):
    id: int
    expire_date: Optional[date]
