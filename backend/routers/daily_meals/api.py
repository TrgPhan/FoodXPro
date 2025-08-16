from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from datetime import date
from typing import Annotated, Literal
from db import get_db
from utils.auth import get_current_user
from models.users import Users
from models.userMeals import UserMeals
from models.recipeIncludeIngredient import RecipeIncludeIngredient
from models.userIngredients import UserIngredients
from models.recipes import Recipes
from models.recipeHaveNutrition import RecipeHaveNutrition
from routers.daily_meals.schemas import DailyMealResponse, RecipeResponse, NutritionResponse

router = APIRouter()

@router.get("/get", response_model=DailyMealResponse)
async def get_daily_meals(
    user: Annotated[Users, Depends(get_current_user)], 
    db: Annotated[AsyncSession, Depends(get_db)], 
    day: Annotated[date, Query(description="Day of meals")] = date.today()
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
            selectinload(UserMeals.recipe).selectinload(Recipes.recipe_has_nutrition).selectinload(RecipeHaveNutrition.contains_nutrition)
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
                    "value": nutrition_value * servings_eaten, 
                    "unit": nutrition_unit})
            else:
                for i in range(len(nutrition_list)):
                    if nutrition_list[i]["id"] == nutrition_id:
                        nutrition_list[i]["value"] += nutrition_value * servings_eaten

    return {
        "breakfast": breakfast, 
        "lunch": lunch, 
        "dinner": dinner, 
        "snack": snack, 
        "nutrition": nutrition_list
    }

@router.post("/add")
async def add_daily_meals(
    user: Annotated[Users, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)], 
    recipe_id: Annotated[int, Query(description="Recipe ID")],
    eat_at: Annotated[Literal['breakfast', 'lunch', 'dinner', 'snack'], Query(description="breakfast, lunch, dinner or snack")],
    servings_eaten: Annotated[int, Query(description="number of servings eaten")] = 1
):  
    user_meal_result = await db.execute(
        select(UserMeals)
        .where(
            UserMeals.user_id == user.id, 
            UserMeals.recipe_id == recipe_id, 
            func.date(UserMeals.eat_date) == func.current_date(),
            UserMeals.eat_at == eat_at
        ))
    
    user_meal = user_meal_result.scalar_one_or_none()
    if user_meal:
        user_meal.servings_eaten = user_meal.servings_eaten + servings_eaten

        await db.commit()

        return {
            "status": "success",
            "message": "meal already added, servings eaten cumulated"
        }

    ingredient_results = await db.execute(
        select(RecipeIncludeIngredient)
        .options(selectinload(RecipeIncludeIngredient.contains_ingredient))
        .where(RecipeIncludeIngredient.recipe_id == recipe_id)
    )
    ingredients_in_recipe = ingredient_results.scalars().all()

    user_ingredient_results = await db.execute(select(UserIngredients).where(
        UserIngredients.user_id == user.id
    ))
    user_ingredients = user_ingredient_results.scalars().all()
    ingredient_ids = [user_ingredient.ingredient_id for user_ingredient in user_ingredients]

    for ingredient in ingredients_in_recipe:
        ingredient_id = ingredient.ingredient_id
        if ingredient_id not in ingredient_ids:
            raise HTTPException(
                status_code=409,
                detail=f"User does not have the ingredient: {ingredient.contains_ingredient.name}"
            )

    new_user_meal = UserMeals(
        user_id = user.id,
        recipe_id = recipe_id,
        servings_eaten = servings_eaten,
        eat_date = func.now(),
        eat_at = eat_at
    )

    db.add(new_user_meal)

    await db.commit()

    return {
        "status": "success",
        "message": "Meal added successfully"
    }

@router.put("/edit")
async def edit_daily_meals(user: Annotated[Users, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)],
                           new_servings_eaten: Annotated[int, Query(description="new number of servings eaten")],
                           recipe_id: Annotated[int, Query(description="Recipe ID")],
                           eat_date: Annotated[date, Query(description="The date when the meal is eaten")],
                           eat_at: Annotated[Literal['breakfast', 'lunch', 'dinner', 'snack'], Query(description="breakfast, lunch, dinner or snack")]):
    if new_servings_eaten < 1:
        raise HTTPException(
            status_code= 400,
            detail="servings_eaten has to be a positive integer"
        )
    
    user_meal = await db.execute(select(UserMeals).where(
        UserMeals.user_id == user.id, 
        UserMeals.recipe_id == recipe_id, 
        func.date(UserMeals.eat_date) == eat_date,
        UserMeals.eat_at == eat_at
    ))

    user_meal = user_meal.scalars().one_or_none()

    if user_meal is None:
        raise HTTPException(
            status_code=404,
            detail="No such meal found"
        )
    user_meal.servings_eaten = new_servings_eaten

    await db.commit()

    return{
        "status": "success",
        "message": "meal edited successfully"
    }

@router.delete("/delete")
async def delete_daily_meal(user: Annotated[Users, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)],
                           recipe_id: Annotated[int, Query(description="Recipe ID")],
                           eat_date: Annotated[date, Query(description="The date when the meal is eaten")],
                           eat_at: Annotated[Literal['breakfast', 'lunch', 'dinner', 'snack'], Query(description="breakfast, lunch, dinner or snack")]):
    user_meal = await db.execute(select(UserMeals).where(
        UserMeals.user_id == user.id, 
        UserMeals.recipe_id == recipe_id, 
        func.date(UserMeals.eat_date) == eat_date,
        UserMeals.eat_at == eat_at
    ))

    user_meal = user_meal.scalars().one_or_none()

    if user_meal is None:
        raise HTTPException(
            status_code=404,
            detail="No such meal found"
        )
    
    db.delete(user_meal)
    await db.commit()
    
    return{
        "status": "success",
        "message": "meal deleted successfully"
    }