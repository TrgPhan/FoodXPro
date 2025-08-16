from __future__ import annotations

from datetime import date, timedelta
import random
import time
import hashlib
from typing import Any, Dict, List, Tuple, Optional
import heapq
from collections import defaultdict

from langchain_core.tools import tool

from routers.auth.api import get_agent_context
from utils.auth import get_current_user
from db import AsyncSessionLocal
from crud import (
    get_user_data,
    get_user_ingredients,
    get_recipes_ingredients_data,
    get_recipes_data,
    get_recipe_nutrition_data,
    get_user_allergic_ingredients,
)
from utils.recipes import (
    get_sufficient_recipes as get_sufficient_recipes_util,
    get_insufficient_recipes as get_insufficient_recipes_util,
)
from app.agents.tools.get_daily_meals_tool import get_daily_meals_core
from app.agents.tools.get_daily_nutrition_gaps_tool import _build_goals_map, _build_consumed_map


# Enhanced nutrient weights
NUTRIENT_WEIGHTS: Dict[str, float] = {
    "Protein": 3.0,
    "Fiber": 2.5,
    "Vitamin C": 2.0,
    "Vitamin A": 2.0,
    "Calcium": 2.0,
    "Iron": 2.5,
    "Potassium": 1.8,
    "Carbs": 1.0,
    "Fat": 0.8,
    "Calories": 0.4,
}

# Recipe categories for diversity (you might want to add a category field to your recipe model)
RECIPE_CATEGORIES = {
    "protein_source": ["chicken", "beef", "pork", "fish", "tofu", "beans", "eggs"],
    "cuisine_type": ["asian", "western", "mediterranean", "indian", "mexican", "italian"],
    "cooking_method": ["grilled", "fried", "steamed", "baked", "stir-fry", "soup", "salad"],
    "meal_type": ["light", "heavy", "liquid", "solid", "hot", "cold"]
}

# Dynamic threshold
MIN_GAP_THRESHOLD = 0.05


def _generate_session_seed(day: str, user_id: int, additional_entropy: Optional[str] = None) -> int:
    """Generate a pseudo-random but deterministic seed for each session/call"""
    # Create base string from day and user
    base_string = f"{day}_{user_id}"
    
    # Add timestamp for uniqueness between calls
    timestamp = str(int(time.time() * 1000))  # milliseconds
    
    # Add additional entropy if provided
    if additional_entropy:
        base_string += f"_{additional_entropy}"
    
    # Add timestamp to ensure different calls get different seeds
    seed_string = f"{base_string}_{timestamp}"
    
    # Generate deterministic but unique seed
    hash_object = hashlib.md5(seed_string.encode())
    return int(hash_object.hexdigest()[:8], 16) % (2**31)


def _extract_recipe_features(recipe_data: Dict[str, Any]) -> Dict[str, str]:
    """Extract categorizable features from recipe data for diversity scoring"""
    features = {
        "protein_source": "unknown",
        "cuisine_type": "unknown", 
        "cooking_method": "unknown",
        "meal_type": "unknown"
    }
    
    if not recipe_data:
        return features
    
    # Extract from recipe name/description (basic keyword matching)
    recipe_text = (
        str(recipe_data.get("name", "")).lower() + " " + 
        str(recipe_data.get("description", "")).lower()
    )
    
    # Categorize protein source
    for protein in RECIPE_CATEGORIES["protein_source"]:
        if protein in recipe_text:
            features["protein_source"] = protein
            break
    
    # Categorize cuisine type
    for cuisine in RECIPE_CATEGORIES["cuisine_type"]:
        if cuisine in recipe_text:
            features["cuisine_type"] = cuisine
            break
    
    # Categorize cooking method
    for method in RECIPE_CATEGORIES["cooking_method"]:
        if method in recipe_text:
            features["cooking_method"] = method
            break
    
    # Simple meal type classification based on calories/ingredients count
    try:
        calories = float(recipe_data.get("calories", 0))
        if calories < 200:
            features["meal_type"] = "light"
        elif calories > 500:
            features["meal_type"] = "heavy"
        else:
            features["meal_type"] = "medium"
    except:
        features["meal_type"] = "medium"
    
    return features


def _to_nutrition_map(nutritions: List[Dict[str, Any]]) -> Dict[str, float]:
    """Map nutrition list to name -> value (float)."""
    result: Dict[str, float] = {}
    for item in nutritions or []:
        name = item.get("name")
        value = item.get("value")
        if name is None or value is None:
            continue
        try:
            result[name] = float(value)
        except Exception:
            continue
    return result


def _calculate_gap_criticality(gaps: Dict[str, Tuple[float, str]], goals_map: Dict[str, Dict]) -> Dict[str, float]:
    """Calculate gap criticality with randomization factor"""
    criticality: Dict[str, float] = {}
    
    for name, (remaining, unit) in gaps.items():
        if name not in goals_map:
            continue
            
        goal_value = float(goals_map[name].get("value", 1.0))
        if goal_value <= 0:
            continue
            
        percentage_remaining = min(1.0, remaining / goal_value)
        weight = NUTRIENT_WEIGHTS.get(name, 1.0)
        
        base_criticality = (percentage_remaining ** 1.5) * weight
        
        # Add small randomization to break ties and create variety
        randomization_factor = 0.8 + (random.random() * 0.4)  # 0.8 to 1.2
        criticality[name] = base_criticality * randomization_factor
    
    return criticality


def _calculate_gap_filling_score(
    recipe_nutr_map: Dict[str, float],
    remaining_gaps: Dict[str, Tuple[float, str]],
    gap_criticality: Dict[str, float]
) -> Tuple[float, Dict[str, float]]:
    """Enhanced gap filling score with randomization"""
    total_score = 0.0
    nutrient_contributions: Dict[str, float] = {}
    
    for name, (remaining, unit) in remaining_gaps.items():
        if remaining <= MIN_GAP_THRESHOLD:
            continue
            
        recipe_value = float(recipe_nutr_map.get(name, 0.0))
        if recipe_value <= 0:
            continue
            
        gap_fill_ratio = recipe_value / remaining
        effective_fill = min(1.0, gap_fill_ratio)
        criticality = gap_criticality.get(name, 1.0)
        
        contribution = effective_fill * criticality
        
        # Add small randomization to contribution
        randomization = 0.9 + (random.random() * 0.2)  # 0.9 to 1.1
        contribution *= randomization
        
        nutrient_contributions[name] = contribution
        total_score += contribution
        
        # Overfill penalty
        if gap_fill_ratio > 1.5:
            overfill_penalty = (gap_fill_ratio - 1.5) * criticality * 0.3
            total_score -= overfill_penalty
    
    return max(0.0, total_score), nutrient_contributions


def _calculate_enhanced_diversity_score(
    candidate_recipe: Dict[str, Any],
    selected_recipes: List[Dict[str, Any]],
    candidate_features: Dict[str, str],
    selected_features_list: List[Dict[str, str]]
) -> float:
    """Enhanced diversity calculation based on recipe features and nutrition"""
    if not selected_recipes:
        return 1.0
    
    diversity_score = 1.0
    candidate_id = candidate_recipe["recipe_id"]
    candidate_nutr = _to_nutrition_map(candidate_recipe.get("nutritions", []))
    
    for i, selected in enumerate(selected_recipes):
        selected_id = selected.get("recipe_id", 0)
        selected_nutr = _to_nutrition_map(selected.get("nutritions", []))
        selected_features = selected_features_list[i] if i < len(selected_features_list) else {}
        
        # Feature-based diversity penalty
        feature_similarity = 0.0
        total_features = len(candidate_features)
        
        for feature_type, candidate_value in candidate_features.items():
            selected_value = selected_features.get(feature_type, "unknown")
            if candidate_value == selected_value and candidate_value != "unknown":
                feature_similarity += 1.0
        
        if total_features > 0:
            feature_similarity_ratio = feature_similarity / total_features
            diversity_score *= (1.0 - feature_similarity_ratio * 0.4)  # Up to 40% penalty
        
        # Nutrition profile similarity penalty
        nutrition_similarity = _calculate_nutrition_profile_similarity(candidate_nutr, selected_nutr)
        diversity_score *= (1.0 - nutrition_similarity * 0.3)  # Up to 30% penalty
        
        # Recipe ID proximity penalty (for similar recipes)
        id_distance = abs(candidate_id - selected_id)
        if id_distance < 20:  # Similar recipe IDs
            proximity_penalty = (20 - id_distance) / 20 * 0.25
            diversity_score *= (1.0 - proximity_penalty)
        
        # Exact duplicate penalty
        if candidate_id == selected_id:
            diversity_score = 0.0
            break
    
    # Add randomization to diversity score to break ties
    randomization = 0.85 + (random.random() * 0.3)  # 0.85 to 1.15
    diversity_score *= randomization
    
    return max(0.05, diversity_score)  # Minimum diversity score


def _calculate_nutrition_profile_similarity(profile1: Dict[str, float], profile2: Dict[str, float]) -> float:
    """Calculate nutritional similarity between two recipes (0.0 = different, 1.0 = identical)"""
    if not profile1 or not profile2:
        return 0.0
    
    # Focus on key nutrients
    key_nutrients = ["Protein", "Carbs", "Fat", "Fiber", "Iron", "Calcium", "Vitamin C"]
    similarities = []
    
    for nutrient in key_nutrients:
        val1 = profile1.get(nutrient, 0)
        val2 = profile2.get(nutrient, 0)
        
        if val1 == 0 and val2 == 0:
            similarities.append(0.5)  # Both empty - neutral similarity
        elif val1 == 0 or val2 == 0:
            similarities.append(0.0)  # One has, other doesn't
        else:
            # Calculate ratio similarity
            ratio = min(val1, val2) / max(val1, val2)
            similarities.append(ratio)
    
    return sum(similarities) / len(similarities) if similarities else 0.0


def _select_diverse_recipes_with_randomization(
    candidates: List[Dict[str, Any]],
    remaining_gaps: Dict[str, Tuple[float, str]],
    gap_criticality: Dict[str, float],
    num_recipes: int,
    diversity_factor: float = 0.3,
    randomization_strength: float = 0.15
) -> List[Dict[str, Any]]:
    """Enhanced selection with multiple randomization layers"""
    if not candidates or num_recipes <= 0:
        return []
    
    # Pre-extract features for all candidates
    candidate_features = {}
    for candidate in candidates:
        recipe_id = candidate["recipe_id"]
        candidate_features[recipe_id] = _extract_recipe_features(candidate.get("recipe", {}))
    
    selected_recipes: List[Dict[str, Any]] = []
    used_recipe_ids: set[int] = set()
    current_gaps = dict(remaining_gaps)
    current_criticality = dict(gap_criticality)
    selected_features_list: List[Dict[str, str]] = []
    
    # Shuffle candidates initially
    shuffled_candidates = candidates.copy()
    random.shuffle(shuffled_candidates)
    
    for selection_round in range(num_recipes):
        if not current_gaps:
            break
            
        candidate_scores = []
        
        # Evaluate each candidate
        for candidate in shuffled_candidates:
            recipe_id = candidate["recipe_id"]
            if recipe_id in used_recipe_ids:
                continue
                
            recipe_nutr_map = _to_nutrition_map(candidate.get("nutritions", []))
            features = candidate_features.get(recipe_id, {})
            
            # Gap filling score
            gap_score, contributions = _calculate_gap_filling_score(
                recipe_nutr_map, current_gaps, current_criticality
            )
            
            # Diversity score
            diversity_score = _calculate_enhanced_diversity_score(
                candidate, selected_recipes, features, selected_features_list
            )
            
            # Dynamic diversity weighting
            phase_diversity_weight = diversity_factor * min(1.0, (selection_round + 1) / num_recipes)
            gap_weight = 1.0 - phase_diversity_weight
            
            # Combined score with additional randomization
            base_combined_score = gap_weight * gap_score + phase_diversity_weight * diversity_score
            
            # Add randomization for variety between calls
            final_randomization = 1.0 + (random.random() - 0.5) * 2 * randomization_strength
            combined_score = base_combined_score * final_randomization
            
            if combined_score > 0:
                candidate_scores.append({
                    "candidate": candidate,
                    "combined_score": combined_score,
                    "gap_score": gap_score,
                    "diversity_score": diversity_score,
                    "contributions": contributions,
                    "features": features
                })
        
        if not candidate_scores:
            break
        
        # Sort and introduce some randomness in selection
        candidate_scores.sort(key=lambda x: x["combined_score"], reverse=True)
        
        # Sometimes pick from top 3 instead of always picking #1 (for variety)
        top_candidates = candidate_scores[:min(3, len(candidate_scores))]
        
        if len(top_candidates) > 1 and random.random() < randomization_strength:
            # Weighted random selection from top candidates
            weights = [c["combined_score"] for c in top_candidates]
            total_weight = sum(weights)
            if total_weight > 0:
                rand_val = random.random() * total_weight
                cumulative = 0
                chosen_idx = 0
                for i, weight in enumerate(weights):
                    cumulative += weight
                    if rand_val <= cumulative:
                        chosen_idx = i
                        break
                chosen = top_candidates[chosen_idx]
            else:
                chosen = top_candidates[0]
        else:
            chosen = candidate_scores[0]
        
        # Add to selection
        selected_candidate = chosen["candidate"]
        selected_recipes.append({
            **selected_candidate,
            "selection_score": chosen["combined_score"],
            "gap_contribution": chosen["gap_score"],
            "diversity_contribution": chosen["diversity_score"],
            "nutrient_contributions": chosen["contributions"]
        })
        
        used_recipe_ids.add(selected_candidate["recipe_id"])
        selected_features_list.append(chosen["features"])
        
        # Update remaining gaps
        selected_nutr_map = _to_nutrition_map(selected_candidate.get("nutritions", []))
        current_gaps = _update_remaining_gaps(current_gaps, selected_nutr_map)
        
        # Update criticality
        if current_gaps:
            current_criticality = {
                name: score for name, score in current_criticality.items()
                if name in current_gaps
            }
    
    return selected_recipes


def _update_remaining_gaps(
    remaining_gaps: Dict[str, Tuple[float, str]],
    recipe_nutr_map: Dict[str, float],
) -> Dict[str, Tuple[float, str]]:
    """Update remaining gaps after adding a recipe's nutrition."""
    updated: Dict[str, Tuple[float, str]] = {}
    for name, (remaining, unit) in remaining_gaps.items():
        value = float(recipe_nutr_map.get(name, 0.0))
        new_remaining = max(0.0, remaining - max(0.0, value))
        if new_remaining > MIN_GAP_THRESHOLD:
            updated[name] = (new_remaining, unit)
    return updated


def _default_meal_slots(meal_slots: List[str] | None) -> List[str]:
    if meal_slots and len(meal_slots) > 0:
        return meal_slots
    return ["breakfast", "lunch", "dinner"]


@tool(
    "suggest_meals_diverse",
    description=(
        "Suggest diverse recipes to fill nutrition gaps with enhanced variety between calls. "
        "Each call will return different combinations even with same parameters. "
        "Includes randomization_strength (0.0-0.5) to control variety level."
    ),
)
async def suggest_meals_tool(
    day: str, 
    eat_again: bool, 
    time_not_eat_again: int, 
    diversity: float, 
    min_dish: int, 
    allow_missing_count: List[int], 
    meal_slots: List[str], 
    include_allergies: bool = False,
    randomization_strength: float = 0.5,
    variety_seed: Optional[str] = None
) -> dict:
    """
    Enhanced meal suggestion with improved diversity and randomization.
    
    New parameters:
    - randomization_strength: 0.0-0.5, controls how much variety between calls (default 0.15)
    - variety_seed: Optional string for additional entropy in randomization
    """
    
    # Input validation
    if not isinstance(allow_missing_count, list) or not all(isinstance(x, int) and x >= 0 for x in allow_missing_count):
        return {"tool": "suggest_meals_diverse", "raw_data": {"error": "allow_missing_count must be a list of non-negative integers"}}
    
    if time_not_eat_again < 0:
        return {"tool": "suggest_meals_diverse", "raw_data": {"error": "time_not_eat_again must be non-negative"}}
    
    # Clamp parameters
    diversity = max(0.0, min(1.0, diversity))
    randomization_strength = max(0.0, min(0.5, randomization_strength))
    min_dish = max(1, min_dish)
    
    # Authentication
    agent_context = get_agent_context()
    if not agent_context.get("access_token"):
        return {"tool": "suggest_meals_diverse", "raw_data": {"error": "Not authenticated. Please login."}}

    # Parse target date
    try:
        target_day = date.today() if not day else date.fromisoformat(day)
    except ValueError:
        return {"tool": "suggest_meals_diverse", "raw_data": {"error": "Invalid 'day' format. Use YYYY-MM-DD."}}

    meal_slots_use = _default_meal_slots(meal_slots)

    # Get user and generate unique seed for this call
    async with AsyncSessionLocal() as db_session:
        user = await get_current_user(agent_context["access_token"], db_session)
        user_id = getattr(user, 'id', 0)
        
        # Generate unique seed for this call to ensure variety
        session_seed = _generate_session_seed(day, user_id, variety_seed)
        random.seed(session_seed)
        
        user_data = await get_user_data(user)
        goals_map = _build_goals_map(user_data)
        meals_today = await get_daily_meals_core(user=user, db=db_session, day=target_day)
        consumed_map = _build_consumed_map(meals_today.get("nutrition"))

        # Get eating history
        eaten_recipe_ids: set[int] = set()
        if not eat_again and time_not_eat_again > 0:
            start_date = target_day - timedelta(days=time_not_eat_again)
            for i in range((target_day - start_date).days + 1):
                check_date = start_date + timedelta(days=i)
                try:
                    daily_meals = await get_daily_meals_core(user=user, db=db_session, day=check_date)
                    if daily_meals and daily_meals.get("meals"):
                        for meal in daily_meals["meals"]:
                            if meal.get("recipe_id"):
                                eaten_recipe_ids.add(meal["recipe_id"])
                except Exception:
                    continue

    # Calculate remaining gaps
    remaining_gaps: Dict[str, Tuple[float, str]] = {}
    for name, goal in goals_map.items():
        goal_value = float(goal.get("value", 0.0))
        unit = goal.get("unit", "")
        consumed_value = float(consumed_map.get(name, 0.0))
        remaining = goal_value - consumed_value
        if remaining > MIN_GAP_THRESHOLD:
            remaining_gaps[name] = (remaining, unit)

    if not remaining_gaps:
        return {
            "tool": "suggest_meals_diverse",
            "raw_data": {
                "date": target_day.isoformat(),
                "meal_slots": meal_slots_use,
                "suggestions": [],
                "remaining_gaps": [],
                "note": "All nutrition goals are already met for this day.",
                "session_seed": session_seed,
            },
        }

    # Calculate gap criticality with randomization
    gap_criticality = _calculate_gap_criticality(remaining_gaps, goals_map)

    # Gather candidates with increased pool size and randomization
    candidates: List[Dict[str, Any]] = []
    seen_recipe_ids: set[int] = set()

    async with AsyncSessionLocal() as db_session:
        user = await get_current_user(agent_context["access_token"], db_session)
        user_ingredients = await get_user_ingredients(user)
        recipes_ingredients = await get_recipes_ingredients_data()
        
        user_allergic_ingredients = []
        if not include_allergies:
            user_allergic_ingredients = await get_user_allergic_ingredients(user)

        # Get sufficient recipes with larger pool
        sufficient_ids = get_sufficient_recipes_util(
            user_ingredients,
            recipes_ingredients,
            "calories",
            "asc",
            user_allergic_ingredients,
        )
        
        if not eat_again:
            sufficient_ids = [rid for rid in sufficient_ids if rid not in eaten_recipe_ids]
        
        # Increase candidate pool and randomize
        random.shuffle(sufficient_ids)
        max_sufficient = min(400, len(sufficient_ids))  # Increased from 300
        
        for recipe_id in sufficient_ids[:max_sufficient]:
            try:
                recipe_data = await get_recipes_data(recipe_id)
                recipe_nutritions = await get_recipe_nutrition_data(recipe_id)
                candidates.append({
                    "recipe_id": recipe_id,
                    "recipe": recipe_data,
                    "nutritions": recipe_nutritions,
                    "missing_ingredients": [],
                    "missing_count": 0,
                })
                seen_recipe_ids.add(recipe_id)
            except Exception:
                continue

        # Add recipes with missing ingredients
        if allow_missing_count:
            for missing in allow_missing_count:
                if missing < 0:
                    continue
                try:
                    infos = get_insufficient_recipes_util(
                        user_ingredients,
                        recipes_ingredients,
                        "calories",
                        "asc",
                        missing,
                        180,  # Increased from 150
                        user_allergic_ingredients,
                    )
                    
                    if not eat_again:
                        infos = [info for info in infos if info.get("recipe_id") not in eaten_recipe_ids]
                    
                    random.shuffle(infos)
                    for info in infos:
                        recipe_id = info.get("recipe_id")
                        if recipe_id in seen_recipe_ids:
                            continue
                        try:
                            recipe_data = await get_recipes_data(recipe_id)
                            recipe_nutritions = await get_recipe_nutrition_data(recipe_id)
                            candidates.append({
                                "recipe_id": recipe_id,
                                "recipe": recipe_data,
                                "nutritions": recipe_nutritions,
                                "missing_ingredients": info.get("missing_ingredients", []),
                                "missing_count": info.get("missing_count", missing),
                            })
                            seen_recipe_ids.add(recipe_id)
                        except Exception:
                            continue
                except Exception:
                    continue

    if not candidates:
        return {
            "tool": "suggest_meals_diverse",
            "raw_data": {
                "date": target_day.isoformat(),
                "meal_slots": meal_slots_use,
                "suggestions": [],
                "remaining_gaps": [
                    {"name": n, "remaining_value": v, "unit": u} for n, (v, u) in remaining_gaps.items()
                ],
                "note": "No suitable recipes found with current ingredient availability.",
                "session_seed": session_seed,
            },
        }

    # Select recipes using enhanced diverse algorithm
    total_recipes_needed = len(meal_slots_use) * min_dish
    selected_recipes = _select_diverse_recipes_with_randomization(
        candidates=candidates,
        remaining_gaps=remaining_gaps,
        gap_criticality=gap_criticality,
        num_recipes=total_recipes_needed,
        diversity_factor=diversity,
        randomization_strength=randomization_strength
    )

    # Distribute recipes across meal slots
    assigned_meals = []
    recipe_index = 0
    
    for slot in meal_slots_use:
        slot_recipes = []
        for dish_num in range(min_dish):
            if recipe_index < len(selected_recipes):
                recipe = selected_recipes[recipe_index]
                slot_recipes.append({
                    "meal": slot if dish_num == 0 else f"{slot}_dish_{dish_num + 1}",
                    "nutrition_score": round(recipe.get("gap_contribution", 0), 4),
                    "diversity_score": round(recipe.get("diversity_contribution", 0), 4),
                    "combined_score": round(recipe.get("selection_score", 0), 4),
                    "recipe": recipe["recipe"],
                    "nutritions": recipe["nutritions"],
                    "missing_ingredients": recipe.get("missing_ingredients", []),
                    "missing_count": recipe.get("missing_count", 0),
                    "nutrient_contributions": recipe.get("nutrient_contributions", {})
                })
                recipe_index += 1
        assigned_meals.extend(slot_recipes)

    # Calculate final remaining gaps
    final_gaps = dict(remaining_gaps)
    for recipe in selected_recipes:
        recipe_nutr_map = _to_nutrition_map(recipe.get("nutritions", []))
        final_gaps = _update_remaining_gaps(final_gaps, recipe_nutr_map)

    remaining_list = [
        {"name": n, "remaining_value": round(v, 4), "unit": u} 
        for n, (v, u) in final_gaps.items()
    ]

    return {
        "tool": "suggest_meals_diverse",
        "raw_data": {
            "date": target_day.isoformat(),
            "meal_slots": meal_slots_use,
            "suggestions": assigned_meals,
            "remaining_gaps": remaining_list,
            "diversity_summary": {
                "total_candidates_evaluated": len(candidates),
                "recipes_selected": len(selected_recipes),
                "major_gaps_addressed": len(remaining_gaps) - len(final_gaps),
                "diversity_factor_applied": diversity,
                "randomization_strength_applied": randomization_strength,
                "session_seed": session_seed,
                "variety_features_used": ["recipe_categories", "nutrition_profiles", "selection_randomization"],
                "gap_reduction_percentage": round(
                    (1 - (sum(v for _, (v, _) in final_gaps.items()) / 
                     max(1, sum(v for _, (v, _) in remaining_gaps.items())))) * 100, 2
                )
            }
        },
    }