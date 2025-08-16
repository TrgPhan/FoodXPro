from __future__ import annotations

from datetime import date
from typing import Dict, Any, List

from langchain_core.tools import tool

from routers.auth.api import get_agent_context
from utils.auth import get_current_user
from db import AsyncSessionLocal
from crud import get_user_data
from utils.profile import calculate_macors_intake, calculate_micros_intake
from config import NUTRITION_UNITS
from app.agents.tools.get_daily_meals_tool import get_daily_meals_core


def _build_goals_map(user_data: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
	"""Create a mapping from nutrition name -> {value, unit} for daily goals."""
	macro_goals = calculate_macors_intake(
		user_data.get("weight"),
		user_data.get("height"),
		user_data.get("age"),
		user_data.get("sex"),
		user_data.get("activity_level"),
		user_data.get("goal"),
	)
	micro_goals = calculate_micros_intake(user_data.get("age"), user_data.get("sex"))

	goals: Dict[str, Dict[str, Any]] = {}
	for name, value in {**macro_goals, **micro_goals}.items():
		if value is None:
			continue
		unit = NUTRITION_UNITS.get(name, "")
		goals[name] = {"value": float(value), "unit": unit}
	return goals


def _build_consumed_map(nutrition_list: List[Dict[str, Any]]) -> Dict[str, float]:
	"""Create a mapping from nutrition name -> consumed value for the day."""
	consumed: Dict[str, float] = {}
	for item in nutrition_list or []:
		name = item.get("name")
		value = item.get("value")
		if name is None or value is None:
			continue
		try:
			value_f = float(value)
		except Exception:
			continue
		consumed[name] = consumed.get(name, 0.0) + value_f
	return consumed


@tool(
	"get_daily_nutrition_gaps",
	description=(
		"Analyze daily nutrition vs goals for a specific day using user's profile and meals. "
		"Returns lack (deficits) and excess (over-consumed). Input: day (YYYY-MM-DD), empty for today."
	),
)
async def get_daily_nutrition_gaps_tool(day: str) -> dict:
	agent_context = get_agent_context()
	if not agent_context.get("access_token"):
		return {"tool": "get_daily_nutrition_gaps", "raw_data": {"error": "Not authenticated. Please login."}}

	try:
		target_day = date.today() if not day else date.fromisoformat(day)
	except ValueError:
		return {"tool": "get_daily_nutrition_gaps", "raw_data": {"error": "Invalid 'day' format. Use YYYY-MM-DD."}}

	async with AsyncSessionLocal() as db_session:
		user = await get_current_user(agent_context["access_token"], db_session)
		user_data = await get_user_data(user)
		goals_map = _build_goals_map(user_data)

		meals = await get_daily_meals_core(user=user, db=db_session, day=target_day)
		consumed_map = _build_consumed_map(meals.get("nutrition"))

	lack: List[Dict[str, Any]] = []
	excess: List[Dict[str, Any]] = []
	for name, goal in goals_map.items():
		goal_value = goal.get("value", 0.0)
		unit = goal.get("unit", "")
		consumed_value = float(consumed_map.get(name, 0.0))
		remaining = goal_value - consumed_value
		percent = (consumed_value / goal_value * 100.0) if goal_value > 0 else 0.0
		if remaining > 0:
			lack.append(
				{
					"name": name,
					"remaining_value": remaining,
					"unit": unit,
					"goal_value": goal_value,
					"consumed_value": consumed_value,
					"percent_achieved": percent,
				}
			)
		elif remaining < 0:
			excess.append(
				{
					"name": name,
					"excess_value": -remaining,
					"unit": unit,
					"goal_value": goal_value,
					"consumed_value": consumed_value,
					"percent_achieved": percent,
				}
			)

	result = {
		"date": target_day.isoformat(),
		"lack": lack,
		"excess": excess,
		"gaps": lack,
		"total_goals": len(goals_map),
		"num_lack": len(lack),
		"num_excess": len(excess),
	}

	return {"tool": "get_daily_nutrition_gaps", "raw_data": result}


