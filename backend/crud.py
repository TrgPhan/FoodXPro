import json
from db import AsyncSessionLocal
from models import ingredients, nutritions, recipeHaveNutrition, recipeIncludeIngredient, recipes, users, userIngredients, userHealthConditions, userAllergies, healthConditions, allergies, ingredientAllergies, healthConditionAffectNutrition
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import delete
from config import NUTRITION_UNITS
from routers.profile.schemas import HealthCondition, Allergy, UserDataForm

_cache_reicpes_ingredients = None
_cache_recipes_nutrtions = None


async def init_health_conditions(db):
    with open('data/health_conditions_researched.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    for health_condition in data:
        health_condition_name = health_condition["Health Condition Name"]
        new_health_condition = healthConditions.HealthConditions(
            name=health_condition_name
        )

        db.add(new_health_condition)
        await db.flush()

        health_condition_id = new_health_condition.id

        affected_nutritions = health_condition["Affected Nutritions"]

        for affected_nutrition in affected_nutritions:
            affected_nutrition_name = affected_nutrition["Name"]
            adjusted_value = affected_nutrition["Adjusted Value"]

            nutrition_id = await db.execute(select(nutritions.Nutritions.id).
                                            where(nutritions.Nutritions.name == affected_nutrition_name))
            nutrition_id = nutrition_id.scalar()

            new_health_condition_affect_nutrition = healthConditionAffectNutrition.HealthConditionAffectNutrition(
                health_condition_id=health_condition_id,
                nutrition_id=nutrition_id,
                adjusted_value=adjusted_value
            )

            db.add(new_health_condition_affect_nutrition)

    await db.commit()


async def init_allergies(db):
    added_allergies = set()

    with open('data/ingredient_allergies.json', 'r', encoding='utf-8') as f:
        ingredient_allergies = json.load(f)

    for ingredient_allergy in ingredient_allergies:
        for ingredient_name, allergy_list in ingredient_allergy.items():
            ingredient_name = ingredient_name.strip().lower().replace('-',
                                                                      " ").replace('®', ' ')
            ingredient_name = " ".join(ingredient_name.split())
            for allergy_name in allergy_list:
                if allergy_name not in added_allergies:
                    added_allergies.add(allergy_name)
                    new_allergy = allergies.Allergies(
                        name=allergy_name.replace('_', " ")
                    )

                    db.add(new_allergy)
                    await db.flush()

                    allergy_id = new_allergy.id

                else:
                    allergy_id = await db.execute(
                        select(allergies.Allergies.id).where(
                            allergies.Allergies.name == allergy_name))
                    allergy_id = allergy_id.scalar()

                ingredient_id = await db.execute(
                    select(ingredients.Ingredients.id).where(
                        ingredients.Ingredients.name == ingredient_name))
                ingredient_id = ingredient_id.scalar()

                new_allergy_of_ingredient = ingredientAllergies.IngredientAllergies(
                    ingredient_id=ingredient_id,
                    allergy_id=allergy_id
                )

                db.add(new_allergy_of_ingredient)

    await db.commit()


async def init_db_data():

    async with AsyncSessionLocal() as db:
        # Check if data already exists
        existing_recipes = await db.execute(select(recipes.Recipes))
        if existing_recipes.scalars().first() is not None:
            print("Database already contains data. Skipping initialization.")
            return

        print("Initializing database with recipe data...")

        # create a set of added ingredients and nutritions to check for duplication
        added_ingredients = set()
        added_nutritions = {"Calories"}

        # load the data
        with open('data/processed_recipes.json', 'r', encoding="utf-8") as f:
            processed_recipes = json.load(f)

        # add calories manually
        new_nutrition = nutritions.Nutritions(
            name="Calories",
            unit="kcal"
        )
        db.add(new_nutrition)
        await db.flush()

        # Get the recipe's basic data
        total_recipes = len(processed_recipes)
        print(f"Processing {total_recipes} recipes...")

        for i, recipe in enumerate(processed_recipes, 1):
            if i % 100 == 0:
                print(f"Processed {i}/{total_recipes} recipes...")
            name = recipe['name']
            description = recipe['description']
            image = recipe['image']
            prep_time = recipe['prep_time']
            additional_time = recipe['additional_time']
            cook_time = recipe['cook_time']
            chill_time = recipe['chill_time']
            total_time = recipe['total_time']
            servings = recipe['servings']
            yields = recipe['yield']
            recipe_ingredients = recipe['ingredients']
            ingredient_nutrition_fact = recipe["nutrition_facts"]
            ingredient_nutrition_label = recipe["nutrition_label"]

            calories = ingredient_nutrition_fact.get("Calories", 0)
            fat = ingredient_nutrition_fact.get("Fat", 0)
            carbs = ingredient_nutrition_fact.get("Carbs", 0)
            protein = ingredient_nutrition_fact.get("Protein", 0)

            # create a new row
            new_recipe = recipes.Recipes(
                name=name,
                description=description,
                image_url=image,
                prep_time=prep_time,
                additional_time=additional_time,
                cook_time=cook_time,
                chill_time=chill_time,
                total_time=total_time,
                servings=servings,
                yields=yields,
                calories=calories,
                fat=fat,
                carbs=carbs,
                protein=protein
            )

            # add the data and await for flush to get its id
            db.add(new_recipe)
            await db.flush()

            recipe_id = new_recipe.id

            # Track ingredients for this recipe to handle duplicates
            recipe_ingredients_dict = {}

            # loop through all the recipe's ingredients
            for ingredient in recipe_ingredients:
                # avoid same ingredient with different names like 'heavy duty aluminum foil',
                # 'Heavy duty aluminum foil', Reynolds Wrap Heavy-Duty Aluminum Foil,
                # Reynolds Wrap® Heavy Duty Aluminum Foil
                ingredient_name = ingredient.get("Name").strip(
                ).lower().replace('-', " ").replace('®', ' ')
                ingredient_name = " ".join(ingredient_name.split())
                if ingredient['Amount']:
                    ingredient_amount = ingredient['Amount'][0]
                else:
                    ingredient_amount = 0

                if ingredient_amount is not None and ingredient_amount != 0:
                    ingredient_unit = ingredient_amount['Unit']
                    # ingredient_unit has a special type of null: "", so we will have to check
                    if ingredient_unit == "":
                        ingredient_unit = None
                else:
                    ingredient_unit = None

                ingredient_size = ingredient.get("Size")
                if ingredient_size is not None:
                    ingredient_size = ingredient_size[20:-
                                                      1].split(',')[0].strip('"()').strip("'")
                preparation = ingredient["Preparation"]
                prepared_ingredient = preparation is not None
                comment = ingredient['Comment']
                if comment is not None:
                    comment = comment[20:-
                                      1].split(',')[0].strip('"()').strip("'")

                # Check for duplication
                if ingredient_name not in added_ingredients:
                    new_ingredient = ingredients.Ingredients(
                        name=ingredient_name
                    )
                    # add the data and await for flush to get its id
                    db.add(new_ingredient)
                    await db.flush()

                    ingredient_id = new_ingredient.id

                    added_ingredients.add(ingredient_name)
                else:
                    ingredient_id = await db.execute(
                        select(ingredients.Ingredients.id).where(
                            ingredients.Ingredients.name == ingredient_name))
                    ingredient_id = ingredient_id.scalar()

                # handle some exceptions of quantity
                if ingredient_amount is not None and ingredient_amount != 0:
                    # null quantity
                    if ingredient_amount['Quantity'] == "":
                        ingredient_amount = 0
                    # string quantity, but there is text and number
                    # text example: "half"
                    # number example: "15-20"
                    elif isinstance(ingredient_amount['Quantity'], str):
                        try:
                            min, max = map(
                                float, ingredient_amount['Quantity'].split('-'))
                            ingredient_amount = (min + max) / 2
                        except Exception as e:
                            ingredient_amount = 0
                    else:
                        ingredient_amount = ingredient_amount['Quantity']

                # Create a key for this ingredient (name + unit + preparation)
                ingredient_key = f"{ingredient_name}_{ingredient_unit}_{ingredient_size}_{preparation}"

                if ingredient_key in recipe_ingredients_dict:
                    # Ingredient already exists in this recipe, combine amounts
                    existing_ingredient = recipe_ingredients_dict[ingredient_key]
                    if ingredient_amount is not None and existing_ingredient['amount'] is not None:
                        # Combine amounts
                        existing_ingredient['amount'] += ingredient_amount
                        # Combine comments if both have comments
                        if comment and existing_ingredient['comment']:
                            existing_ingredient['comment'] = f"{existing_ingredient['comment']}; {comment}"
                        elif comment:
                            existing_ingredient['comment'] = comment
                    continue  # Skip creating duplicate entry
                else:
                    # First occurrence of this ingredient in this recipe
                    recipe_ingredients_dict[ingredient_key] = {
                        'ingredient_id': ingredient_id,
                        'size': ingredient_size,
                        'amount': ingredient_amount,
                        'unit': ingredient_unit,
                        'preparation': preparation,
                        'prepared_ingredient': prepared_ingredient,
                        'comment': comment
                    }

            # Now create the recipe-ingredient relationships for unique ingredients
            for ingredient_data in recipe_ingredients_dict.values():
                new_ingredient_in_recipe = recipeIncludeIngredient.RecipeIncludeIngredient(
                    recipe_id=recipe_id,
                    ingredient_id=ingredient_data['ingredient_id'],
                    size=ingredient_data['size'],
                    amount=ingredient_data['amount'],
                    unit=ingredient_data['unit'],
                    preparation=ingredient_data['preparation'],
                    prepared_ingredient=ingredient_data['prepared_ingredient'],
                    comment=ingredient_data['comment']
                )
                db.add(new_ingredient_in_recipe)

            # again, add Calories manually
            nutrition_id = 1
            amount = ingredient_nutrition_label.get("Calories", 0)
            percent = 0

            new_nutrition_in_recipe = recipeHaveNutrition.RecipeHaveNutrition(
                recipe_id=recipe_id,
                nutrition_id=nutrition_id,
                value=amount,
                percent=percent
            )

            db.add(new_nutrition_in_recipe)
            await db.flush()

            # loop through all the nutritions:
            # skip the first key:val pair, it is calories, which we dont need
            for nutrition_name, nutrition_detail in list(ingredient_nutrition_label.items())[1:]:
                if nutrition_name not in added_nutritions:
                    nutrition_unit = NUTRITION_UNITS[nutrition_name]

                    new_nutrition = nutritions.Nutritions(
                        name=nutrition_name,
                        unit=nutrition_unit
                    )

                    db.add(new_nutrition)
                    await db.flush()

                    nutrition_id = new_nutrition.id

                    added_nutritions.add(nutrition_name)
                else:
                    nutrition_id = await db.execute(
                        select(nutritions.Nutritions.id).where(
                            nutritions.Nutritions.name == nutrition_name))
                    nutrition_id = nutrition_id.scalar()

                if isinstance(nutrition_detail, dict) and "amount" in nutrition_detail:
                    amount = nutrition_detail["amount"]
                    percent = nutrition_detail.get(
                        "percent (% Daily Value)", 0)
                else:
                    details = list(nutrition_detail.values()) if hasattr(
                        nutrition_detail, 'values') else [0, 0]
                    amount = details[0] if len(details) > 0 else 0
                    percent = details[1] if len(details) > 1 else 0

                new_nutrition_in_recipe = recipeHaveNutrition.RecipeHaveNutrition(
                    recipe_id=recipe_id,
                    nutrition_id=nutrition_id,
                    value=amount,
                    percent=percent
                )

                db.add(new_nutrition_in_recipe)

        await db.commit()
        await init_allergies(db)
        await init_health_conditions(db)
        print("Database initialization completed successfully!")


async def get_user_ingredients(user: users.Users):
    async with AsyncSessionLocal() as db:
        user_ingredients = await db.execute(select(userIngredients.UserIngredients).where(userIngredients.UserIngredients.user_id == user.id))
        user_ingredients = user_ingredients.scalars().all()
        user_ingredient_list = [ui.ingredient_id for ui in user_ingredients]
    return user_ingredient_list


async def get_recipes_ingredients_data():
    global _cache_reicpes_ingredients
    if _cache_reicpes_ingredients is not None:
        return _cache_reicpes_ingredients

    async with AsyncSessionLocal() as db:
        recipe_ingredients_query = await db.execute(
            select(
                recipes.Recipes.prep_time,
                recipes.Recipes.cook_time,
                recipes.Recipes.total_time,
                recipes.Recipes.calories,
                recipes.Recipes.fat,
                recipes.Recipes.carbs,
                recipes.Recipes.protein,
                recipeIncludeIngredient.RecipeIncludeIngredient.recipe_id,
                recipeIncludeIngredient.RecipeIncludeIngredient.ingredient_id,
                recipeIncludeIngredient.RecipeIncludeIngredient.unit,
                recipeIncludeIngredient.RecipeIncludeIngredient.amount,
                ingredients.Ingredients.name.label('ingredient_name')
            ).select_from(recipeIncludeIngredient.RecipeIncludeIngredient)
            .join(ingredients.Ingredients, recipeIncludeIngredient.RecipeIncludeIngredient.ingredient_id == ingredients.Ingredients.id)
            .join(recipes.Recipes, recipeIncludeIngredient.RecipeIncludeIngredient.recipe_id == recipes.Recipes.id)
        )

        recipe_ingredients_data = recipe_ingredients_query.all()

        recipes_data = {}
        for row in recipe_ingredients_data:
            recipe_id = row.recipe_id
            if recipe_id not in recipes_data:
                recipes_data[recipe_id] = {
                    'recipe_id': recipe_id,
                    'prep_time': row.prep_time,
                    'cook_time': row.cook_time,
                    'total_time': row.total_time,
                    'calories': row.calories,
                    'protein': row.protein,
                    'fat': row.fat,
                    'carbs': row.carbs,
                    'ingredients': []
                }

            recipes_data[recipe_id]['ingredients'].append({
                'ingredient_id': row.ingredient_id,
                'ingredient_name': row.ingredient_name,
                'required_amount': row.amount or 1,
                'unit': row.unit
            })

        _cache_reicpes_ingredients = recipes_data
        print("Cache set")

    return recipes_data


async def get_recipe_nutrition_data(id: int):
    async with AsyncSessionLocal() as db:
        recipe_nutrition_query = await db.execute(
            select(
                recipeHaveNutrition.RecipeHaveNutrition.nutrition_id,
                recipeHaveNutrition.RecipeHaveNutrition.value,
                recipeHaveNutrition.RecipeHaveNutrition.percent,
                nutritions.Nutritions.name.label('nutrition_name'),
                nutritions.Nutritions.unit.label('nutrition_unit')
            ).select_from(recipeHaveNutrition.RecipeHaveNutrition)
            .join(nutritions.Nutritions, recipeHaveNutrition.RecipeHaveNutrition.nutrition_id == nutritions.Nutritions.id)
            .where(recipeHaveNutrition.RecipeHaveNutrition.recipe_id == id)
        )
        recipe_nutrition_data = recipe_nutrition_query.all()
        recipe_nutritions = []
        for row in recipe_nutrition_data:
            recipe_nutrition_dict = {
                'id': row.nutrition_id,
                'name': row.nutrition_name,
                'unit': row.nutrition_unit,
                'value': row.value,
                'percent': row.percent
            }
            recipe_nutritions.append(recipe_nutrition_dict)
        return recipe_nutritions


async def get_recipes_data(id: int):
    async with AsyncSessionLocal() as db:
        recipe_query = await db.execute(select(recipes.Recipes).where(recipes.Recipes.id == id))
        recipe_data = recipe_query.scalar()

        if recipe_data is None:
            raise ValueError(f"Recipe with id {id} not found")

        recipe_data = {
            'id': recipe_data.id,
            'name': recipe_data.name,
            'description': recipe_data.description,
            'image_url': recipe_data.image_url,
            'prep_time': recipe_data.prep_time,
            'additional_time': recipe_data.additional_time,
            'cook_time': recipe_data.cook_time,
            'chill_time': recipe_data.chill_time,
            'total_time': recipe_data.total_time,
            'servings': recipe_data.servings,
            'yields': recipe_data.yields,
            'calories': recipe_data.calories,
            'fat': recipe_data.fat,
            'carbs': recipe_data.carbs,
            'protein': recipe_data.protein
        }
        return recipe_data


async def get_user_data(user: users.Users):
    async with AsyncSessionLocal() as db:
        # Get basic user data
        user_query = await db.execute(
            select(users.Users).where(users.Users.id == user.id)
        )
        user_data = user_query.scalar()

        if user_data is None:
            raise ValueError(f"User with id {user.id} not found")

        # Get user's health conditions
        health_conditions_query = await db.execute(
            select(healthConditions.HealthConditions)
            .join(userHealthConditions.UserHealthConditions, healthConditions.HealthConditions.id == userHealthConditions.UserHealthConditions.health_condition_id)
            .where(userHealthConditions.UserHealthConditions.user_id == user.id)
        )
        health_conditions = health_conditions_query.scalars().all()

        # Get user's allergies
        allergies_query = await db.execute(
            select(allergies.Allergies)
            .join(userAllergies.UserAllergies, allergies.Allergies.id == userAllergies.UserAllergies.allergy_id)
            .where(userAllergies.UserAllergies.user_id == user.id)
        )
        user_allergies = allergies_query.scalars().all()

        return {
            'id': user_data.id,
            'full_name': user_data.full_name,
            'age': user_data.age,
            'weight': user_data.weight,
            'height': user_data.height,
            'goal': user_data.goal,
            'sex': user_data.sex,
            'activity_level': user_data.activity_level,
            'health_conditions': [HealthCondition(id=hc.id, name=hc.name) for hc in health_conditions],
            'allergies': [Allergy(id=a.id, name=a.name) for a in user_allergies]
        }


async def edit_user_data(user: users.Users, edit_form: UserDataForm):
    async with AsyncSessionLocal() as db:
        user_data = await db.execute(select(users.Users).where(users.Users.id == user.id))
        user_data = user_data.scalar()
        user_data.full_name = edit_form.full_name
        user_data.age = edit_form.age
        user_data.weight = edit_form.weight
        user_data.height = edit_form.height
        user_data.goal = edit_form.goal
        user_data.sex = edit_form.sex
        user_data.activity_level = edit_form.activity_level
        await db.commit()

        current_allergies_id = await db.execute(
            select(userAllergies.UserAllergies.allergy_id)
            .where(userAllergies.UserAllergies.user_id == user.id)
        )
        current_allergies_id = set(current_allergies_id.scalars().all())

        new_allergies_id = await db.execute(
            select(allergies.Allergies.id)
            .where(allergies.Allergies.name.in_(edit_form.allergy))
        )
        new_allergies_id = set(new_allergies_id.scalars().all())

        removed_allergies_id = current_allergies_id - new_allergies_id
        if removed_allergies_id:
            await db.execute(
                delete(userAllergies.UserAllergies)
                .where(userAllergies.UserAllergies.user_id == user.id)
                .where(userAllergies.UserAllergies.allergy_id.in_(removed_allergies_id))
            )

        added_allergies_id = new_allergies_id - current_allergies_id
        if added_allergies_id:
            for allergy_id in added_allergies_id:
                new_user_allergy = userAllergies.UserAllergies(
                    user_id=user.id,
                    allergy_id=allergy_id
                )
                db.add(new_user_allergy)

        current_health_conditions_id = await db.execute(
            select(userHealthConditions.UserHealthConditions.health_condition_id)
            .where(userHealthConditions.UserHealthConditions.user_id == user.id)
        )
        current_health_conditions_id = set(
            current_health_conditions_id.scalars().all())

        new_health_conditions_id = await db.execute(
            select(healthConditions.HealthConditions.id)
            .where(healthConditions.HealthConditions.name.in_(edit_form.health_condition))
        )
        new_health_conditions_id = set(
            new_health_conditions_id.scalars().all())

        removed_health_conditions_id = current_health_conditions_id - new_health_conditions_id

        if removed_health_conditions_id:
            await db.execute(
                delete(userHealthConditions.UserHealthConditions)
                .where(userHealthConditions.UserHealthConditions.user_id == user.id)
                .where(userHealthConditions.UserHealthConditions.health_condition_id.in_(removed_health_conditions_id))
            )

        added_health_conditions_id = new_health_conditions_id - current_health_conditions_id

        if added_health_conditions_id:
            for health_condition_id in added_health_conditions_id:
                new_user_health_condition = userHealthConditions.UserHealthConditions(
                    user_id=user.id,
                    health_condition_id=health_condition_id
                )
                db.add(new_user_health_condition)

        await db.commit()


async def add_user_data(user: users.Users, add_form: UserDataForm):
    async with AsyncSessionLocal() as db:
        user = await db.execute(
            select(users.Users)
            .where(users.Users.id == user.id)
        )
        user = user.scalar()
        user.full_name = add_form.full_name
        user.age = add_form.age
        user.weight = add_form.weight
        user.height = add_form.height
        user.goal = add_form.goal
        user.sex = add_form.sex
        user.activity_level = add_form.activity_level

        # Store user_id before committing
        user_id = user.id

        await db.commit()

        add_allergies_id = await db.execute(
            select(allergies.Allergies.id)
            .where(allergies.Allergies.name.in_(add_form.allergy))
        )
        add_allergies_id = set(add_allergies_id.scalars().all())
        for allergy_id in add_allergies_id:
            new_user_allergy = userAllergies.UserAllergies(
                user_id=user_id,
                allergy_id=allergy_id
            )
            db.add(new_user_allergy)

        add_health_conditions_id = await db.execute(
            select(healthConditions.HealthConditions.id)
            .where(healthConditions.HealthConditions.name.in_(add_form.health_condition))
        )
        add_health_conditions_id = set(
            add_health_conditions_id.scalars().all())
        for health_condition_id in add_health_conditions_id:
            new_user_health_condition = userHealthConditions.UserHealthConditions(
                user_id=user_id,
                health_condition_id=health_condition_id
            )
            db.add(new_user_health_condition)
        await db.commit()


async def get_recipes_nutritions_data():
    global _cache_recipes_nutrtions
    async with AsyncSessionLocal() as db:
        if _cache_recipes_nutrtions is not None:
            return _cache_recipes_nutrtions
        recipes_nutritions_query = await db.execute(
            select(
                recipes.Recipes.id,
                recipeHaveNutrition.RecipeHaveNutrition.nutrition_id,
                recipeHaveNutrition.RecipeHaveNutrition.value,
                recipeHaveNutrition.RecipeHaveNutrition.percent,
                nutritions.Nutritions.name.label('nutrition_name'),
                nutritions.Nutritions.unit.label('nutrition_unit')
            ).select_from(recipeHaveNutrition.RecipeHaveNutrition)
            .join(nutritions.Nutritions, recipeHaveNutrition.RecipeHaveNutrition.nutrition_id == nutritions.Nutritions.id)
            .join(recipes.Recipes, recipeHaveNutrition.RecipeHaveNutrition.recipe_id == recipes.Recipes.id)
        )
        recipes_nutritions_data = recipes_nutritions_query.all()
        recipes_nutritions = {}
        for row in recipes_nutritions_data:
            recipe_id = row.id
            if recipe_id not in recipes_nutritions:
                recipes_nutritions[recipe_id] = []

            nutrition_data = {
                'id': row.nutrition_id,
                'name': row.nutrition_name,
                'unit': row.nutrition_unit,
                'value': row.value,
                'percent': row.percent
            }
            recipes_nutritions[recipe_id].append(nutrition_data)

        _cache_recipes_nutrtions = recipes_nutritions

        return recipes_nutritions


async def get_user_allergic_ingredients(user: users.Users):
    async with AsyncSessionLocal() as db:
        try:
            user_allergies_query = await db.execute(
                select(ingredientAllergies.IngredientAllergies.ingredient_id)
                .select_from(userAllergies.UserAllergies)
                .join(ingredientAllergies.IngredientAllergies, userAllergies.UserAllergies.allergy_id == ingredientAllergies.IngredientAllergies.allergy_id)
                .where(userAllergies.UserAllergies.user_id == user.id)
            )
            user_allergic_ingredients = user_allergies_query.scalars().all()
            return user_allergic_ingredients

        except Exception as e:
            print(f"Error fetching user allergic ingredient: {e}")
            return []


async def get_user_health_conditions(user: users.Users):
    async with AsyncSessionLocal() as db:
        health_conditions_query = await db.execute(
            select(healthConditions.HealthConditions.id)
            .join(userHealthConditions.UserHealthConditions, healthConditions.HealthConditions.id == userHealthConditions.UserHealthConditions.health_condition_id)
            .where(userHealthConditions.UserHealthConditions.user_id == user.id)
        )
        health_conditions = health_conditions_query.scalars().all()
        return health_conditions


async def get_affected_nutritions(health_condition_id: int):
    async with AsyncSessionLocal() as db:
        affected_nutritions_query = await db.execute(
            select(nutritions.Nutritions.name,
                   healthConditionAffectNutrition.HealthConditionAffectNutrition.adjusted_value)
            .join(nutritions.Nutritions, healthConditionAffectNutrition.HealthConditionAffectNutrition.nutrition_id == nutritions.Nutritions.id)
            .where(healthConditionAffectNutrition.HealthConditionAffectNutrition.health_condition_id == health_condition_id)
        )
        affected_nutritions = affected_nutritions_query.all()
        affected_nutritions_dict = {row[0]: row[1]
                                    for row in affected_nutritions}
        return affected_nutritions_dict
