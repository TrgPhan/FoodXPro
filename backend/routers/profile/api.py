from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import os
import json
import traceback
from typing import Annotated
from db import get_db
from utils.auth import get_current_user
from models.users import Users
from routers.profile.schemas import NutritionGoal, UserDataForm, UserResponse
from crud import get_user_data, edit_user_data, add_user_data, get_user_health_conditions, get_affected_nutritions
from utils.profile import calculate_macors_intake, calculate_micros_intake, calculate_adjusted_value
from config import NUTRITION_UNITS

router = APIRouter()

@router.get("/get", response_model=UserResponse)
async def get_profile(user: Users = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user_data = await get_user_data(user)
    user_health_conditions = await get_user_health_conditions(user)
    
    macro_goals = calculate_macors_intake(user_data.get("weight"), user_data.get("height"), user_data.get("age"), user_data.get("sex"), user_data.get("activity_level"), user_data.get("goal"))
    micro_goals = calculate_micros_intake(user_data.get("age"), user_data.get("sex"))
    
    user_nutritions_goal = macro_goals | micro_goals

    for health_condition in user_health_conditions:
        affected_nutritions = await get_affected_nutritions(health_condition)
        user_nutritions_goal = calculate_adjusted_value(user, user_nutritions_goal, affected_nutritions)

    user_data["nutritions_goal"] = [
        NutritionGoal(name=name, value=value, unit=NUTRITION_UNITS[name])
        for name, value in user_nutritions_goal.items()
    ]

    return user_data

@router.put("/edit")
async def edit_profile(edit_form: UserDataForm, user: Users = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await edit_user_data(user, edit_form)
    return {
        "status": "success",
        "message": "Profile updated successfully"
    }

@router.post("/add")
async def add_profile(add_form: UserDataForm, user: Users = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await add_user_data(user, add_form)
    return {
        "status": "success",
        "message": "Profile added successfully"
    }