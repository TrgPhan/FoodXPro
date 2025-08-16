from sqlalchemy import Integer, Column, Text, String
from sqlalchemy.orm import relationship
from db import Base


class Ingredients(Base):
    __tablename__ = 'Ingredients'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)

    ingredient_in_recipe = relationship(
        'RecipeIncludeIngredient', back_populates='contains_ingredient', lazy='noload')
    user_has_ingredient = relationship(
        'UserIngredients', back_populates='ingredient', lazy='noload')
    ingredient_allergies = relationship(
        'IngredientAllergies', back_populates='ingredient', lazy='noload')