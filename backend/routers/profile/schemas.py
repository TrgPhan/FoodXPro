from pydantic import BaseModel
from typing import Optional, List, ForwardRef, Literal

class NutritionGoal(BaseModel):
    name: str
    value: float
    unit: str

class HealthCondition(BaseModel):
    id: int
    name: str

class Allergy(BaseModel):
    id: int
    name: str

class UserResponse(BaseModel):
    full_name: str
    age: int
    sex: str
    weight: float
    height: float
    goal: str
    activity_level: str
    allergies: List[Allergy]
    health_conditions: List[HealthCondition]
    nutritions_goal: List[NutritionGoal]

class UserDataForm(BaseModel):
    full_name: str
    age: int
    sex: str
    weight: float
    height: float
    goal: Literal["Cutting", "Bulking", "Maintaining", "Giảm cân", "Tăng cân", "Giữ cân"] = "Maintaining"
    activity_level: Literal["Sedentary", "Lightly Active", "Moderately Active", "Very Active", "Super Active", "Không vận động", "Ít vận động", "Vận động vừa phải", "Vận động nhiều", "Vận động rất nhiều"] = "Vận động vừa phải"
    allergy: List[str]
    health_condition: List[str]