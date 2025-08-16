from __future__ import annotations

from typing import Literal
from langchain_core.tools import tool
from routers.auth.api import get_agent_context
from utils.auth import get_current_user
from db import AsyncSessionLocal
from crud import (
	get_user_ingredients,
	get_recipes_ingredients_data,
	get_recipes_data,
	get_recipe_nutrition_data,
	get_user_allergic_ingredients,
)
from utils.recipes import get_insufficient_recipes as get_insufficient_recipes_util


@tool(
	"get_insufficient_recipes",
	description=(
		"Get recipes where the user is missing exactly N ingredients. "
		"Inputs: missing_count (int, number of missing ingredients), limit (int, number of recipes to return). "
		"Optional inputs: sort_by (prep_time, cook_time, total_time, calories, protein, fat, carbs), "
		"sort_order (asc or desc), include_allergies (bool). Defaults: sort_by=calories, sort_order=asc, include_allergies=false."
	),
)
async def get_insufficient_recipes_tool(
	missing_count: int,
	limit: int,
	sort_by: Literal['prep_time', 'cook_time', 'total_time', 'calories', 'protein', 'fat', 'carbs'] = 'calories',
	sort_order: Literal['asc', 'desc'] = 'asc',
	include_allergies: bool = False,
) -> dict:
	if missing_count < 0:
		return {"tool": "get_insufficient_recipes", "raw_data": {"error": "missing_count must be non-negative"}}
	if limit <= 0:
		return {"tool": "get_insufficient_recipes", "raw_data": {"error": "limit must be positive"}}

	agent_context = get_agent_context()
	if not agent_context.get("access_token"):
		return {"tool": "get_insufficient_recipes", "raw_data": {"error": "Not authenticated. Please login."}}

	async with AsyncSessionLocal() as db_session:
		user = await get_current_user(agent_context["access_token"], db_session)
		user_ingredients = await get_user_ingredients(user)
		recipes_ingredients = await get_recipes_ingredients_data()
		
		user_allergic_ingredients = []
		if not include_allergies:
			user_allergic_ingredients = await get_user_allergic_ingredients(user)

		insufficient_recipe_infos = get_insufficient_recipes_util(
			user_ingredients,
			recipes_ingredients,
			sort_by,
			sort_order,
			missing_count,
			limit,
			user_allergic_ingredients,
		)

		insufficient_recipes = []
		for info in insufficient_recipe_infos:
			try:
				recipe_id = info['recipe_id']
				recipe_data = await get_recipes_data(recipe_id)
				recipe_nutrition = await get_recipe_nutrition_data(recipe_id)
				insufficient_recipes.append({
					'recipe': recipe_data,
					'nutritions': recipe_nutrition,
					'missing_ingredients': info['missing_ingredients'],
					'missing_count': info['missing_count'],
				})
			except Exception:
				# Skip bad records silently for tool usage
				continue

	return {"tool": "get_insufficient_recipes", "raw_data": insufficient_recipes}

