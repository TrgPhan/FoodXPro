from sqlalchemy import Integer, Column, Text
from sqlalchemy.orm import relationship
from db import Base


class HealthConditions(Base):
    __tablename__ = 'HealthConditions'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)

    user_has_health_condition = relationship(
        'UserHealthConditions', back_populates='health_condition', lazy='noload')
    afftect_nutrition = relationship(
        'HealthConditionAffectNutrition', back_populates='health_condition', lazy='noload')