from __future__ import annotations

from typing import List, Dict, Any
from models.users import Users
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from langchain_core.tools import tool
from models.userIngredients import UserIngredients
from routers.auth.api import get_agent_context
from utils.auth import get_current_user
from db import AsyncSessionLocal


async def get_ingredients_core(user: Users, db: AsyncSession) -> List[Dict[str, Any]]:
	"""Return the current user's ingredients in the same shape as the API."""
	ingredient_list: List[Dict[str, Any]] = []

	result = await db.execute(
		select(UserIngredients)
			.options(selectinload(UserIngredients.ingredient))
			.where(UserIngredients.user_id == user.id)
	)
	user_ingredients = result.scalars().all()

	for user_ingredient in user_ingredients:
		id_ = user_ingredient.ingredient_id
		name = user_ingredient.ingredient.name
		added_at = user_ingredient.added_at
		expire_at = user_ingredient.expire_at

		# Ensure JSON-serializable values for dates
		add_date_serialized = (
			added_at.date().isoformat() if hasattr(added_at, "date") and added_at is not None else None
		)
		expire_date_serialized = (
			expire_at.date().isoformat() if hasattr(expire_at, "date") and expire_at is not None else None
		)

		ingredient_list.append(
			{
				"id": id_,
				"name": name,
				"add_date": add_date_serialized,
				"exprire_date": expire_date_serialized,
			}
		)

	return ingredient_list


@tool(
	"get_ingredients",
	description=(
		"Get the current user's ingredients list with amount and dates. "
		"No inputs required."
	),
)
async def get_ingredient_tool() -> dict:
	agent_context = get_agent_context()
	if not agent_context.get("access_token"):
		return {"tool": "get_ingredients", "raw_data": {"error": "Not authenticated. Please login."}}

	async with AsyncSessionLocal() as db_session:
		user = await get_current_user(agent_context["access_token"], db_session)
		data = await get_ingredients_core(user=user, db=db_session)
	return {"tool": "get_ingredients", "raw_data": data}


