from fastapi import APIRouter, HTTPException, status, Depends, Body, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import asc, desc, nulls_last
import os
import json
import traceback
import requests
from typing import Annotated, List, Literal
from db import get_db
from routers.ingredients.schemas import IngredientResponse, IngredientAddForm, IngredientEditForm, UserIngredientResponse
from utils.auth import get_current_user
from models.users import Users
from models.ingredients import Ingredients
from models.userIngredients import UserIngredients
from config import GOGGLE_API_KEY, CSE_ID

router = APIRouter()

@router.get("/get", response_model=List[UserIngredientResponse])
async def get_ingredients(user: Users = Depends(get_current_user), 
                          db: AsyncSession = Depends(get_db), 
                          sort_by: Annotated[Literal["name", "add_date", "expire_date"], 
                                             Query(description="Field to sort by")] = "expire_date",
                          ascending: bool = True):
    ingredient_list = []

    sort_field_map = {
        "name": Ingredients.name,
        "add_date": UserIngredients.added_at,
        "expire_date": UserIngredients.expire_at
    }

    sort_column = sort_field_map[sort_by]

    order_func = asc if ascending else desc

    result = await db.execute(
        select(UserIngredients)
        .options(selectinload(UserIngredients.ingredient))
        .where(UserIngredients.user_id == user.id)
        .order_by(nulls_last(order_func(sort_column)))
    )
    ingredients = result.scalars().all()

    for ingredient in ingredients:
        id = ingredient.ingredient_id
        name = ingredient.ingredient.name
        added_at = ingredient.added_at
        expire_date = ingredient.expire_at

        ingredient_list.append({
                "id": id,
                'name': name,
                'add_date': added_at,
                'expire_date': expire_date
        })

    return ingredient_list
    
@router.post("/add")
async def add_ingredient(ingredient: Annotated[IngredientAddForm, Body(..., description="Ingredient to add")], user: Users = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    ingredient.name = ingredient.name.strip().lower().replace('_', " ").replace('®', ' ').replace("-", " ")
    ingredient.name = " ".join(ingredient.name.split())
    result = await db.execute(select(Ingredients.id).where(Ingredients.name == ingredient.name))
    ingredient_id = result.scalar_one_or_none()

    if ingredient_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ingredient not found")
    
    existing = await db.execute(
        select(UserIngredients).where(
            UserIngredients.user_id == user.id,
            UserIngredients.ingredient_id == ingredient_id
        )
    )

    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Ingredient already added")

    new_user_ingredient = UserIngredients(
        user_id = user.id,
        ingredient_id = ingredient_id,
        added_at = ingredient.add_date,
        expire_at = ingredient.expire_date
    )
    
    db.add(new_user_ingredient)
    await db.commit()

    return {
        "status": "success",
        "message": "Ingredient added successfully"
    }

@router.put("/edit")
async def edit_ingredient(ingredient: Annotated[IngredientEditForm, Body(..., description="Ingredient to edit")], user: Users = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserIngredients).where(
        UserIngredients.user_id == user.id, UserIngredients.ingredient_id == ingredient.id))
    user_ingredient = result.scalars().first()

    if not user_ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user doesn't have this ingredient to edit")

    if ingredient.expire_date:
        user_ingredient.expire_at = ingredient.expire_date

    await db.commit()

    return{
        "status": "success",
        "message": "Ingredient edited successfully"
    }

@router.delete("/delete/{id}")
async def delete_ingredient(id: Annotated[int, Path(..., description="Ingredient ID")], user: Users = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserIngredients).where(
        UserIngredients.ingredient_id == id, UserIngredients.user_id == user.id))
    user_ingredient = result.scalar_one_or_none()

    if not user_ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ingredient not found")
    
    await db.delete(user_ingredient)
    await db.commit()

    return {
        "status": "success",
        "message": "Ingredient deleted successfully"
    }

@router.get("/search", response_model=List[IngredientResponse])
async def search_ingredient(name: Annotated[str, Query(..., description="Ingredient name")], user: Users = Depends(get_current_user), 
                            db: AsyncSession = Depends(get_db), limit: int = 20, ascending: Annotated[bool, Query(..., description="Sort order")] = False):
    name = name.strip().lower().replace('_', " ").replace('®', ' ').replace("-", " ")
    name = " ".join(name.split())
    ingredient_list = []

    result = await db.execute(select(Ingredients)
                              .where(Ingredients.name.ilike(f"%{name}%"))
                              .order_by(asc(Ingredients.name) if ascending else desc(Ingredients.name))
                              .limit(limit))
    ingredients = result.scalars().all()

    for ingredient in ingredients:
        ingredient_list.append({
            "id": ingredient.id,
            "name": ingredient.name
        })

    return ingredient_list

@router.get("/get-ingredient-image")
async def get_ingredient_image(ingredient_id: Annotated[int, Query(description="Ingredient ID")], db: Annotated[AsyncSession, Depends(get_db)]):
    ingredient = await db.execute(select(Ingredients.name).where(Ingredients.id == ingredient_id))
    ingredient = ingredient.scalar_one_or_none()

    if ingredient is None:
        raise HTTPException(
            status_code=404,
            detail="ingredient not found"
        )
    
    url = f"https://www.googleapis.com/customsearch/v1?q={ingredient}&cx={CSE_ID}&searchType=image&key={GOGGLE_API_KEY}"
    response = requests.get(url)
    data = response.json()

    items = data.get("items", [])
    if items:
        first_image_url = items[0]["link"]
        return first_image_url
    else:
        return {
            "status": "failed",
            "message": "huhu"
        }