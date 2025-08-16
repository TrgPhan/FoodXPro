import json
from db import AsyncSessionLocal
from models import ingredients, nutritions, recipeHaveNutrition, recipeIncludeIngredient, recipes, users, userIngredients, userHealthConditions, userAllergies, healthConditions, allergies, ingredientAllergies, healthConditionAffectNutrition
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import delete
from config import NUTRITION_UNITS


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
