from __future__ import annotations

import json
from datetime import date
from models.users import Users
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_core.tools import tool
from sqlalchemy.future import select
from models.userMeals import UserMeals
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from routers.auth.api import get_agent_context
from utils.auth import get_current_user
from db import AsyncSessionLocal
from models.recipes import Recipes
from models.recipeHaveNutrition import RecipeHaveNutrition

async def get_daily_meals_core(
    user: Users, 
    db: AsyncSession, 
    day: date
):
    breakfast = []
    lunch = []
    dinner = []
    snack = []
    nutrition_list = []
    added_nutritions = set()
    result = await db.execute(
        select(UserMeals)
        .options(
            selectinload(UserMeals.recipe),
            selectinload(UserMeals.recipe).selectinload(Recipes.recipe_has_nutrition),
            selectinload(UserMeals.recipe)
            .selectinload(Recipes.recipe_has_nutrition)
            .selectinload(RecipeHaveNutrition.contains_nutrition),
        )
        .where(UserMeals.user_id == user.id, func.date(UserMeals.eat_date) == day)
    )
    user_meals = result.scalars().all()
    for meal in user_meals:
        recipe_id = meal.recipe_id
        recipe = meal.recipe
        recipe_name = recipe.name
        recipe_image = recipe.image_url
        servings_eaten = meal.servings_eaten
        calories = recipe.calories
        if meal.eat_at == 'breakfast':
            breakfast.append({"id": recipe_id, "name": recipe_name, "image": recipe_image, "servings_eaten": servings_eaten, "calories": calories})
        elif meal.eat_at == 'lunch':
            lunch.append({"id": recipe_id, "name": recipe_name, "image": recipe_image, "servings_eaten": servings_eaten, "calories": calories})
        elif meal.eat_at == 'dinner':
            dinner.append({"id": recipe_id, "name": recipe_name, "image": recipe_image, "servings_eaten": servings_eaten, "calories": calories})
        else:
            snack.append({"id": recipe_id, "name": recipe_name, "image": recipe_image, "servings_eaten": servings_eaten, "calories": calories})

        for nutrition in recipe.recipe_has_nutrition:
            nutrition_id = nutrition.nutrition_id
            nutrition_value = nutrition.value
            if nutrition_id not in added_nutritions:
                added_nutritions.add(nutrition_id)
                nutrition = nutrition.contains_nutrition
                nutrition_name = nutrition.name
                nutrition_unit = nutrition.unit

                nutrition_list.append(
                    {"id": nutrition_id, 
                    "name": nutrition_name,
                    "value": nutrition_value, 
                    "unit": nutrition_unit})
            else:
                for i in range(len(nutrition_list)):
                    if nutrition_list[i]["id"] == nutrition_id:
                        nutrition_list[i]["value"] += nutrition_value

    return {
        "breakfast": breakfast, 
        "lunch": lunch, 
        "dinner": dinner, 
        "snack": snack, 
        "nutrition": nutrition_list
    }



@tool(
    "get_daily_meals",
    description=(
        "Get a user's daily meals and aggregated nutrition for a specific day. "
        "Inputs: user_id (int), optional day (YYYY-MM-DD). Defaults to today if day not provided."
    ),
)
async def get_daily_meals_tool(day: str):
    agent_context = get_agent_context()
    if not agent_context.get("access_token"):
        # trả về cấu trúc lỗi (frontend có thể xử lý)
        return {"tool": "get_daily_meals", "raw_data": {"error": "Not authenticated. Please login."}}

    try:
        target_day = date.today() if not day else date.fromisoformat(day)
    except ValueError:
        return {"tool": "get_daily_meals", "raw_data": {"error": "Invalid 'day' format. Use YYYY-MM-DD."}}

    async with AsyncSessionLocal() as db_session:
        user = await get_current_user(agent_context["access_token"], db_session)
        data = await get_daily_meals_core(user=user, day=target_day, db=db_session)

    # Trả về dict — agent sẽ nhận và chèn vào cuộc hội thoại.
    return {"tool": "get_daily_meals", "raw_data": data}
