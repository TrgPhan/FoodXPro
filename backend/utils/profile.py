from config import ACTIVITY_LEVELS, EATING_GOALS, CONVERT_TO_CALORIES
from typing import Dict, Any
import re
from models import users


def parse_adjusted_value_details(adjusted_value: str, nutrition: str) -> Dict[str, Any]:
    """
    Parse the details of an adjusted value string.

    Args:
        adjusted_value (str): The adjusted value string to parse
        nutrition (str): The nutrition name
    Returns:
        Dict[str, Any]: Parsed details including direction, value, and unit
    """
    details = {
        "Nutrition": nutrition,
        "original": adjusted_value,
        "direction": None,  # "+" for increase, "-" for decrease, "<" or "≤" for limit
        "value": None,
        "unit": None,
        "description": None,
        "comparison": None,  # "<", "≤", ">", "≥"
        "range": None,  # For range values like "45-50%"
        "min_value": None,
        "max_value": None,
        "conditional": None,  # For gender/age conditional values
        "male_value": None,
        "female_value": None
    }

    # Extract direction and comparison operators
    if adjusted_value.startswith("+"):
        details["direction"] = "increase"
        value_part = adjusted_value[1:]
    elif adjusted_value.startswith("-"):
        details["direction"] = "decrease"
        value_part = adjusted_value[1:]
    elif adjusted_value.startswith("<"):
        details["direction"] = "limit"
        details["comparison"] = "<"
        value_part = adjusted_value[1:]
    elif adjusted_value.startswith("≤"):
        details["direction"] = "limit"
        details["comparison"] = "≤"
        value_part = adjusted_value[1:]  # Remove both ≤ characters
    else:
        details["direction"] = "neutral"
        value_part = adjusted_value

    # Check for range values (e.g., "45-50%")
    range_pattern = r'(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)(%|mg|g|kg|kcal|g/kg)?'
    numeric_pattern = r'(\d+(?:\.\d+)?)(%|mg|g|kg|kcal|g/kg)?'
    conditional_pattern = r'<(\d+)_male_<(\d+)_female'
    range_match = re.search(range_pattern, value_part)
    numeric_match = re.search(numeric_pattern, value_part)
    conditional_match = re.search(conditional_pattern, value_part)

    if range_match:
        details["range"] = True
        details["min_value"] = float(range_match.group(1))
        details["max_value"] = float(range_match.group(2))
        details["unit"] = range_match.group(
            3) if range_match.group(3) else None
        # Average for compatibility
        details["value"] = (details["min_value"] +
                            details["max_value"]) / 2
    elif numeric_match:
        # Extract single numeric value and unit
        # Pattern for values like "20%", "1500mg", "0.8g/kg"
        details["value"] = float(numeric_match.group(1))
        details["unit"] = numeric_match.group(
            2) if numeric_match.group(2) else None
    elif conditional_match:
        details["conditional"] = True
        details["direction"] = "limit"
        details["comparison"] = "<"
        details["male_value"] = int(conditional_match.group(1))
        details["female_value"] = int(conditional_match.group(2))
        details["description"] = f"Male: <{details['male_value']}, Female: <{details['female_value']}"
    else:
        # Extract description for non-numeric values
        details["description"] = value_part.strip()

    return details


def calculate_adjusted_value(user: users.Users, user_nutritions_goal: Dict[str, float], affected_nutritions: Dict[str, str]) -> Dict[str, float]:
    for nutrition, adjusted_value in affected_nutritions.items():
        parsed_adjusted_value = parse_adjusted_value_details(
            adjusted_value, nutrition)

        if parsed_adjusted_value["description"]:
            continue

        if parsed_adjusted_value["direction"] == "increase":
            if parsed_adjusted_value["unit"] == "%":
                user_nutritions_goal[nutrition] = user_nutritions_goal[nutrition] * (
                    1 + parsed_adjusted_value["value"] / 100)
            elif parsed_adjusted_value["unit"] == "g/kg":
                user_nutritions_goal[nutrition] = user_nutritions_goal[nutrition] + \
                    parsed_adjusted_value["value"] * user.weight
            else:
                user_nutritions_goal[nutrition] = user_nutritions_goal[nutrition] + \
                    parsed_adjusted_value["value"]

        elif parsed_adjusted_value["direction"] == "decrease":
            if parsed_adjusted_value["unit"] == "%":
                user_nutritions_goal[nutrition] = user_nutritions_goal[nutrition] * (
                    1 - parsed_adjusted_value["value"] / 100)
            elif parsed_adjusted_value["unit"] == "g/kg":
                user_nutritions_goal[nutrition] = user_nutritions_goal[nutrition] - \
                    parsed_adjusted_value["value"] * user.weight
            else:
                user_nutritions_goal[nutrition] = user_nutritions_goal[nutrition] - \
                    parsed_adjusted_value["value"]

        elif parsed_adjusted_value["direction"] == "limit":
            if parsed_adjusted_value["unit"] == "%":
                if 'Fat' in nutrition:
                    user_nutritions_goal[nutrition] = (
                        parsed_adjusted_value["value"] / 100 * user_nutritions_goal["Calories"]) / CONVERT_TO_CALORIES['Fat']
                elif 'Carbs' in nutrition:
                    user_nutritions_goal[nutrition] = (
                        parsed_adjusted_value["value"] / 100 * user_nutritions_goal["Calories"]) / CONVERT_TO_CALORIES['Carbs']
                elif 'Protein' in nutrition:
                    user_nutritions_goal[nutrition] = (
                        parsed_adjusted_value["value"] / 100 * user_nutritions_goal["Calories"]) / CONVERT_TO_CALORIES['Protein']
            else:
                user_nutritions_goal[nutrition] = parsed_adjusted_value["value"]

        elif parsed_adjusted_value["conditional"]:
            if user.sex == "male":
                user_nutritions_goal[nutrition] = parsed_adjusted_value["male_value"]
            else:
                user_nutritions_goal[nutrition] = parsed_adjusted_value["female_value"]

    return user_nutritions_goal


def calculate_macors_intake(weight, height, age, sex, activity_level, goal):
    """Calculate the macros (calo, fat, carb, pro) intake for a user based on their weight, height, age, sex, activity level, and goal.

    Args:
        weight (float): The weight of the user in kg
        height (float): The height of the user in cm
        age (int): The age of the user
        sex (str): The sex of the user
        activity_level (str): 5 levels of activity levels
        goal (str): 3 levels of eating goals

    Returns:
        dict: The nutrition intake for the user
    """

    # Validate that all arguments are not None
    if weight is None:
        raise ValueError("weight cannot be None, please update your profile")
    if height is None:
        raise ValueError("height cannot be None, please update your profile")
    if age is None:
        raise ValueError("age cannot be None, please update your profile")
    if sex is None:
        raise ValueError("sex cannot be None, please update your profile")
    if activity_level is None:
        raise ValueError(
            "activity_level cannot be None, please update your profile")
    if goal is None:
        raise ValueError("goal cannot be None, please update your profile")

    BMR = 10 * weight + 6.25 * height - 5 * age
    BMR = BMR + 5 if sex == "male" else BMR - 161
    TDEE = BMR * ACTIVITY_LEVELS[activity_level]
    calorie_intake = TDEE * EATING_GOALS[goal]["calories"]
    protein_intake = calorie_intake * EATING_GOALS[goal]["protein"] / 4
    fat_intake = calorie_intake * EATING_GOALS[goal]["fat"] / 9
    carbohydrates_intake = calorie_intake * \
        EATING_GOALS[goal]["carbohydrates"] / 4
    return {
        "Calories": calorie_intake,
        "Protein": protein_intake,
        "Fat": fat_intake,
        "Carbs": carbohydrates_intake
    }


def calculate_micros_intake(age, sex):
    """Calculate the micros intake for a user based on their age and sex.

    Args:
        age (int): The age of the user
        sex (str): The sex of the user

    Returns:
        dict: The micros intake for the user
    """
    # Validate that all arguments are not None
    if age is None:
        raise ValueError("age cannot be None, please update your profile")
    if sex is None:
        raise ValueError("sex cannot be None, please update your profile")

    if sex == "male":
        sodium_intake = 1500
        sugars_intake = 35
        cholesterol_intake = 250
        if age >= 16:
            dietary_fiber_intake = 30
        elif age < 16 and age >= 11:
            dietary_fiber_intake = 25
        elif age < 11 and age >= 6:
            dietary_fiber_intake = 20
        else:
            dietary_fiber_intake = 15
        vitamin_c_intake = 90
        if age in range(1, 4):
            calcium_intake = 700
        elif age in range(4, 9):
            calcium_intake = 1000
        elif age in range(9, 19):
            calcium_intake = 1300
        elif age in range(19, 51):
            calcium_intake = 1000
        else:
            calcium_intake = 1200
        if age <= 18:
            iron_intake = 10
        else:
            iron_intake = 8
        if age in range(1, 14):
            potassium_intake = 2500
        elif age in range(14, 19):
            potassium_intake = 3000
        else:
            potassium_intake = 3400
        saturated_fat_intake = 23

    elif sex == "female":
        sodium_intake = 1500
        sugars_intake = 22.5
        cholesterol_intake = 225
        if age >= 16:
            dietary_fiber_intake = 30
        elif age < 16 and age >= 11:
            dietary_fiber_intake = 25
        elif age < 11 and age >= 6:
            dietary_fiber_intake = 20
        else:
            dietary_fiber_intake = 15
        vitamin_c_intake = 75
        if age in range(1, 4):
            calcium_intake = 700
        elif age in range(4, 9):
            calcium_intake = 1000
        elif age in range(9, 19):
            calcium_intake = 1300
        elif age in range(19, 51):
            calcium_intake = 1000
        else:
            calcium_intake = 1200
        if age <= 18:
            iron_intake = 14
        else:
            iron_intake = 18
        if age in range(1, 19):
            potassium_intake = 2300
        else:
            potassium_intake = 2600
        saturated_fat_intake = 20
    return {
        "Sodium": sodium_intake,
        "Sugars": sugars_intake,
        "Cholesterol": cholesterol_intake,
        "Dietary Fiber": dietary_fiber_intake,
        "Vitamin C": vitamin_c_intake,
        "Calcium": calcium_intake,
        "Iron": iron_intake,
        "Potassium": potassium_intake,
        "Saturated Fat": saturated_fat_intake
    }
