
from fastapi import APIRouter, HTTPException, status, Depends, Body, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from typing import Annotated, List
from db import get_db
from routers.health_conditions.schemas import HealthConditionAddForm, HealthConditionResponse
from utils.auth import get_current_user
from models.users import Users
from models.healthConditions import HealthConditions
from models.healthConditionAffectNutrition import HealthConditionAffectNutrition

router = APIRouter()


@router.get("/search", response_model=List[HealthConditionResponse])
async def search_health_condition(name: Annotated[str, Query(..., description="Health condition name")], user: Users = Depends(get_current_user), db: AsyncSession = Depends(get_db), limit: int = 20):
    name = " ".join(name.replace("_", " ").split())
    health_condition_list = []

    result = await db.execute(select(HealthConditions).where(HealthConditions.name.ilike(f"%{name}%")).limit(limit))
    health_conditions = result.scalars().all()

    for health_condition in health_conditions:
        health_condition_list.append({
            "id": health_condition.id,
            "name": health_condition.name
        })

    return health_condition_list


@router.post("/add")
async def add_health_condition(health_condition_and_affected_nutritions: Annotated[HealthConditionAddForm, Body(..., description="Health condition, affected nutrition and adjusted value to add")], user: Users = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    health_condition_name = health_condition_and_affected_nutritions.name.strip().replace("_", " ")
    health_condition_name = " ".join(health_condition_name.split())

    health_condition_exists = await db.execute(
        select(HealthConditions.id).
        where(func.lower(HealthConditions.name) == health_condition_name.lower()))
    health_condition_exists = health_condition_exists.scalar_one_or_none()

    if health_condition_exists:
        return {
            "status": "failed",
            "message": "Health condition is already in the database"
        }

    new_health_condition = HealthConditions(
        name=health_condition_name
    )

    db.add(new_health_condition)
    await db.flush()

    health_condition_id = new_health_condition.id

    for nutrition_id, adjusted_value in health_condition_and_affected_nutritions.affected_nutritions.items():
        new_health_condition_affect_nutrition = HealthConditionAffectNutrition(
            health_condition_id=health_condition_id,
            nutrition_id=int(nutrition_id),
            adjusted_value=adjusted_value
        )

        db.add(new_health_condition_affect_nutrition)

    await db.commit()

    return {
        "status": "success",
        "message": "new health condition added successfully"
    }
