from sqlalchemy import Integer, Column, ForeignKey
from sqlalchemy.orm import relationship
from db import Base


class IngredientAllergies(Base):
    __tablename__ = 'IngredientAllergies'

    id = Column(Integer, primary_key=True, index=True)
    ingredient_id = Column(Integer, ForeignKey(
        "Ingredients.id"))
    allergy_id = Column(Integer, ForeignKey(
        'Allergies.id'))
    
    ingredient = relationship(
        'Ingredients', back_populates='ingredient_allergies', lazy='noload')
    allergy = relationship(
        'Allergies', back_populates='ingredient_has_allergy', lazy='noload')