
def get_sufficient_recipes(user_ingredients: list, recipes_data: dict, sort_by: str, sort_order: str, user_allergies: list = []):
    """
    Get all recipes that have all user's ingredients

    Args:
        user_ingredients (list): User's ingredients
        recipes_data (dict): Recipes data
        sort_by (str): Field to sort by
        sort_order (str): Sort order ('asc' or 'desc')
        user_allergies (list): List of user's allergies

    Returns:
        list: List of recipes that have all ingredients
    """
    # Handle None values in sorting by converting them to 0 or a large number
    def sort_key(item):
        value = item[1].get(sort_by)
        if value is None:
            return 0 if sort_order == 'asc' else float('inf')
        return value

    sorted_recipes_data = sorted(
        recipes_data.items(), key=sort_key, reverse=sort_order == 'desc')
    sufficient_recipes = []

    for _, data in sorted_recipes_data:
        has_all_ingredients = True

        for ingredient in data['ingredients']:
            ingredient_id = ingredient['ingredient_id']

            if ingredient_id in user_allergies and user_allergies is not None:
                has_all_ingredients = False
                break

            if ingredient_id not in user_ingredients:
                has_all_ingredients = False
                break

        if has_all_ingredients:
            sufficient_recipes.append(data['recipe_id'])

    return sufficient_recipes


def get_insufficient_recipes(user_ingredients: list, recipes_data: dict, sort_by: str, sort_order: str, missing: int, limit: int = None, user_allergies: list = []):
    """
    Get recipes that have exactly 'missing' number of missing ingredients

    Args:
        user_ingredients (list): User's ingredients
        recipes_data (dict): Recipes data
        sort_by (str): Field to sort by
        sort_order (str): Sort order ('asc' or 'desc')
        missing (int): Number of missing ingredients to filter by
        limit (int): Maximum number of recipes to return
        user_allergies (list): List of user's allergies

    Returns:
        list: List of recipes that have exactly 'missing' missing ingredients with their corresponding missing ingredients and amount
    """
    # Handle None values in sorting by converting them to 0 or a large number
    def sort_key(item):
        value = item[1].get(sort_by)
        if value is None:
            return 0 if sort_order == 'asc' else float('inf')
        return value

    sorted_recipes_data = sorted(
        recipes_data.items(), key=sort_key, reverse=sort_order == 'desc')
    insufficient_recipes = []

    for _, data in sorted_recipes_data:
        missing_count = 0
        missing_ingredients = []
        has_allergies = False

        for ingredient in data['ingredients']:
            ingredient_id = ingredient['ingredient_id']
            required_amount = ingredient['required_amount']

            if ingredient_id in user_allergies and user_allergies is not None:
                has_allergies = True
                break

            if ingredient_id not in user_ingredients:
                missing_count += 1

                recipe_info = {
                    'ingredient_name': ingredient['ingredient_name'],
                    'required_amount': required_amount,
                    'unit': ingredient['unit']
                }
                missing_ingredients.append(recipe_info)

        if has_allergies:
            continue

        elif missing_count == missing:
            recipe_info = {
                'recipe_id': data['recipe_id'],
                'missing_ingredients': missing_ingredients,
                'missing_count': missing_count
            }
            insufficient_recipes.append(recipe_info)

            if limit and len(insufficient_recipes) >= limit:
                break

    return insufficient_recipes
