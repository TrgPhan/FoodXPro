
import datetime
from pydantic import BaseModel
from typing import Optional, List, Tuple
from datetime import date


class AllergyResponse(BaseModel):
    id: int
    name: str


class AllergyAddForm(BaseModel):
    name: str
    ingredient_ids: Optional[List[int]]
