from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Literal, Annotated
import os
import json
import traceback
import requests
from db import get_db
from utils.auth import get_current_user
from models.users import Users
from models.recipes import Recipes
from routers.recipes.schemas import *
from crud import get_user_ingredients, get_recipes_ingredients_data, get_recipes_data, get_recipe_nutrition_data, get_recipes_nutritions_data, get_user_allergic_ingredients
from utils.recipes import get_sufficient_recipes as get_sufficient_recipes_util, get_insufficient_recipes as get_insufficient_recipes_util
from config import GOGGLE_API_KEY, CSE_ID
import time

router = APIRouter()


@router.get("/get-sufficient-recipes", response_model=List[SufficientRecipeResponse])
async def get_sufficient_recipes(
    user: Annotated[Users, Depends(get_current_user)],
    sort_by: Annotated[Literal['prep_time', 'cook_time', 'total_time', 'calories',
                               'protein', 'fat', 'carbs'], Query(description="Field to sort by")] = 'calories',
    sort_order: Annotated[Literal['asc', 'desc'], Query(
        description="Sort order: ascending or descending")] = 'asc',
    include_allergies: Annotated[bool, Query(
        description="Include recipes that may cause user's allergies")] = False
):
    try:
        user_ingredients = await get_user_ingredients(user)
        recipes_ingredients = await get_recipes_ingredients_data()
        user_allergic_ingredients = []
        if not include_allergies:
            user_allergic_ingredients = await get_user_allergic_ingredients(user)

        sufficient_recipes_data = get_sufficient_recipes_util(
            user_ingredients, recipes_ingredients, sort_by, sort_order, user_allergic_ingredients)
        sufficient_recipes = []
        for recipe_id in sufficient_recipes_data:
            try:
                recipe_data = await get_recipes_data(recipe_id)
                recipe_nutrition = await get_recipe_nutrition_data(recipe_id)
                recipe_ingredients = recipes_ingredients[recipe_id]['ingredients']
                sufficient_recipes.append({
                    'recipe': recipe_data,
                    'nutritions': recipe_nutrition,
                    'ingredients': recipe_ingredients
                })
            except ValueError as e:
                print(f"Warning: {e} - Skipping recipe_id {recipe_id}")
                continue
            except Exception as e:
                print(f"Error processing recipe_id {recipe_id}: {e}")
                continue
        return sufficient_recipes
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing request: {str(e)}")


@router.get("/get-insufficient-recipes", response_model=List[InsufficientRecipeResponse])
async def get_insufficient_recipes(
    num_missing: Annotated[int, Query(description="Number of missing ingredients")],
    num_recipes: Annotated[int, Query(description="Number of recipes to return")],
    user: Annotated[Users, Depends(get_current_user)],
    sort_by: Annotated[Literal['prep_time', 'cook_time', 'total_time', 'calories',
                               'protein', 'fat', 'carbs'], Query(description="Field to sort by")] = 'calories',
    sort_order: Annotated[Literal['asc', 'desc'], Query(
        description="Sort order: ascending or descending")] = 'asc',
    include_allergies: Annotated[bool, Query(
        description="Include recipes that may cause user's allergies")] = False
):
    # Validate parameters
    if num_missing < 0:
        raise HTTPException(
            status_code=400, detail="num_missing must be non-negative")
    if num_recipes <= 0:
        raise HTTPException(
            status_code=400, detail="num_recipes must be positive")

    try:
        user_ingredients = await get_user_ingredients(user)
        recipes_ingredients = await get_recipes_ingredients_data()
        user_allergic_ingredients = []
        if not include_allergies:
            user_allergic_ingredients = await get_user_allergic_ingredients(user)
        insufficient_recipes_ids = get_insufficient_recipes_util(
            user_ingredients, recipes_ingredients, sort_by, sort_order, num_missing, num_recipes, user_allergic_ingredients)
        insufficient_recipes = []
        for recipe_info in insufficient_recipes_ids:
            try:
                recipe_data = await get_recipes_data(recipe_info['recipe_id'])
                recipe_nutrition = await get_recipe_nutrition_data(recipe_info['recipe_id'])
                insufficient_recipes.append({
                    'recipe': recipe_data,
                    'nutritions': recipe_nutrition,
                    'missing_ingredients': recipe_info['missing_ingredients'],
                    'missing_count': recipe_info['missing_count']
                })
            except ValueError as e:
                print(
                    f"Warning: {e} - Skipping recipe_id {recipe_info['recipe_id']}")
                continue
            except Exception as e:
                print(
                    f"Error processing recipe_id {recipe_info['recipe_id']}: {e}")
                continue
        return insufficient_recipes
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error processing request: {str(e)}")


@router.get("/get-recipe-image")
async def get_recipe_image(recipe_id: Annotated[int, Query(description="Recipe ID")], db: Annotated[AsyncSession, Depends(get_db)]):
    recipe = await db.execute(select(Recipes.name).where(Recipes.id == recipe_id))
    recipe = recipe.scalar_one_or_none()

    if recipe is None:
        raise HTTPException(
            status_code=404,
            detail="recipe not found"
        )

    url = f"https://www.googleapis.com/customsearch/v1?q={recipe}&cx={CSE_ID}&searchType=image&key={GOGGLE_API_KEY}"
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
