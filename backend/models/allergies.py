from sqlalchemy import Integer, Column, Text
from sqlalchemy.orm import relationship
from db import Base


class Allergies(Base):
    __tablename__ = 'Allergies'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)

    user_has_allergy = relationship(
        'UserAllergies', back_populates='allergy', lazy='noload')
    ingredient_has_allergy = relationship(
        'IngredientAllergies', back_populates='allergy', lazy='noload')