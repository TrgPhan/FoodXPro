from __future__ import annotations

from langchain_core.tools import tool
from routers.auth.api import get_agent_context
from utils.auth import get_current_user
from db import AsyncSessionLocal
from crud import get_user_data
from utils.profile import calculate_macors_intake, calculate_micros_intake
from config import NUTRITION_UNITS


@tool(
	"get_profile",
	description=(
		"Get the current user's profile including calculated macro and micro nutrition goals. "
		"No inputs required."
	),
)
async def get_profile_tool() -> dict:
	agent_context = get_agent_context()
	if not agent_context.get("access_token"):
		return {"tool": "get_profile", "raw_data": {"error": "Not authenticated. Please login."}}

	async with AsyncSessionLocal() as db_session:
		user = await get_current_user(agent_context["access_token"], db_session)
		user_data = await get_user_data(user)

		# Calculate nutrition goals similar to profile API
		macro_goals = calculate_macors_intake(
			user_data.get("weight"),
			user_data.get("height"),
			user_data.get("age"),
			user_data.get("sex"),
			user_data.get("activity_level"),
			user_data.get("goal"),
		)
		micro_goals = calculate_micros_intake(user_data.get("age"), user_data.get("sex"))

		nutritions_goal = []
		for name, value in macro_goals.items():
			unit = NUTRITION_UNITS.get(name, "")
			nutritions_goal.append({"name": name, "value": value, "unit": unit})
		for name, value in micro_goals.items():
			unit = NUTRITION_UNITS.get(name, "")
			nutritions_goal.append({"name": name, "value": value, "unit": unit})

		user_data["nutritions_goal"] = nutritions_goal
	del user_data['full_name']

	return {"tool": "get_profile", "raw_data": user_data}


