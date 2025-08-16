from sqlalchemy import Integer, Column, Text, String
from sqlalchemy.orm import relationship
from db import Base


class Nutritions(Base):
    __tablename__ = 'Nutritions'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    unit = Column(String, nullable=False)

    nutrition_in_recipe = relationship(
        'RecipeHaveNutrition', back_populates='contains_nutrition', lazy='noload')
    affected_by_health_condition = relationship(
        'HealthConditionAffectNutrition', back_populates='nutrition', lazy='noload')