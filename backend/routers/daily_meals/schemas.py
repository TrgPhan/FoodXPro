from pydantic import BaseModel
from typing import List, Optional

class RecipeResponse(BaseModel):
    id: int
    name: str
    image: str
    servings_eaten: int

class NutritionResponse(BaseModel):
    id: int
    name: str
    value: float
    unit: Optional[str] = None

class DailyMealResponse(BaseModel):
    breakfast: Optional[List[RecipeResponse]]
    lunch: Optional[List[RecipeResponse]]
    dinner: Optional[List[RecipeResponse]]
    snack: Optional[List[RecipeResponse]]
    nutrition: Optional[List[NutritionResponse]]
    