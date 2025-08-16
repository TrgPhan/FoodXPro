from sqlalchemy import Integer, Column, Text, String, Float
from sqlalchemy.orm import relationship
from db import Base


class Recipes(Base):
    __tablename__ = 'Recipes'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(String, nullable=True)
    prep_time = Column(Integer, nullable=True)
    cook_time = Column(Integer, nullable=True)
    chill_time = Column(Integer, nullable=True)
    additional_time = Column(Integer, nullable=True)
    total_time = Column(Integer, nullable=True)
    servings = Column(Integer, default=1)
    yields = Column(String, nullable=True)
    calories = Column(Float, nullable=False)
    carbs = Column(Float, nullable=False)
    fat = Column(Float, nullable=False)
    protein = Column(Float, nullable=False)

    recipe_has_ingredient = relationship(
        'RecipeIncludeIngredient', back_populates='contains_recipe', lazy='noload')
    recipe_has_nutrition = relationship(
        'RecipeHaveNutrition', back_populates='contains_recipe', lazy='noload')
    user_ate_meal = relationship(
        'UserMeals', back_populates='recipe', lazy='noload')