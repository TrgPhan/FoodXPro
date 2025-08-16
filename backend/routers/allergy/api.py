from fastapi import APIRouter, HTTPException, status, Depends, Body, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import Annotated, List
from db import get_db
from routers.allergy.schemas import AllergyResponse, AllergyAddForm
from utils.auth import get_current_user
from models.users import Users
from models.allergies import Allergies
from models.ingredientAllergies import IngredientAllergies

router = APIRouter()

@router.get("/search", response_model=List[AllergyResponse])
async def search_allergy(name: Annotated[str, Query(..., description="Allergy name")], user: Users = Depends(get_current_user), db: AsyncSession = Depends(get_db), limit: int = 20):
    name = " ".join(name.replace("_", " ").split())
    allergy_list = []

    result = await db.execute(select(Allergies).where(Allergies.name.ilike(f"%{name}%")).limit(limit))
    allergies = result.scalars().all()

    for allergy in allergies:
        allergy_list.append({
            "id": allergy.id,
            "name": allergy.name
        })

    return allergy_list

@router.post("/add")
async def add_allergy(allergy_and_ingredients: Annotated[AllergyAddForm, Body(..., description="Allergy and Ingredients to add")], user: Users = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    allergy_name = allergy_and_ingredients.name.strip().lower().replace("_", " ")
    allergy_name = " ".join(allergy_name.split())

    allergy_exists = await db.execute(select(Allergies.id).where(Allergies.name == allergy_name))
    allergy_exists = allergy_exists.scalar_one_or_none()

    if allergy_exists:
        return{
            "status": "failed",
            "message": "Allergy is already in the database"
        }

    new_allergy = Allergies(
        name = allergy_name
    )

    db.add(new_allergy)
    await db.flush()

    allergy_id = new_allergy.id

    for ingredient_id in allergy_and_ingredients.ingredient_ids:
        new_ingredient_allergy = IngredientAllergies(
            ingredient_id = ingredient_id,
            allergy_id = allergy_id
        )

        db.add(new_ingredient_allergy)

    await db.commit()

    return {
        "status": "success",
        "message": "new allergy added successfully"
    }