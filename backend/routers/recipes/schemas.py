from pydantic import BaseModel
from typing import List, Optional

class IngredientResponse(BaseModel):
    ingredient_id: int
    ingredient_name: str
    required_amount: Optional[float]
    unit: Optional[str]

class MissingIngredientResponse(BaseModel):
    ingredient_name: str
    required_amount: float
    unit: Optional[str]

class NutritionResponse(BaseModel):
    id: int
    name: str
    unit: str
    value: float
    percent: float

class RecipeResponse(BaseModel):
    id: int
    name: str
    image_url: str
    description: str
    prep_time: Optional[int]
    additional_time: Optional[int]
    cook_time: Optional[int]
    chill_time: Optional[int]
    total_time: Optional[int]
    servings: Optional[int]
    yields: Optional[str]
    calories: Optional[float]
    protein: Optional[float]
    fat: Optional[float]
    carbs: Optional[float]

class SufficientRecipeResponse(BaseModel):
    recipe: RecipeResponse
    nutritions: Optional[List[NutritionResponse]]
    ingredients: Optional[List[IngredientResponse]]

class InsufficientRecipeResponse(BaseModel):
    recipe: RecipeResponse
    nutritions: Optional[List[NutritionResponse]]
    missing_ingredients: Optional[List[MissingIngredientResponse]]
    missing_count: Optional[int]
