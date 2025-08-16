import datetime
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import date

class HealthConditionResponse(BaseModel):
    id: int
    name: str

class HealthConditionAddForm(BaseModel):
    name: str
    affected_nutritions: Dict[int, str]