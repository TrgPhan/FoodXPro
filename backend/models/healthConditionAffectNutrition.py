from sqlalchemy import Integer, Column, ForeignKey, String
from sqlalchemy.orm import relationship
from db import Base


class HealthConditionAffectNutrition(Base):
    __tablename__ = 'HealthConditionAffectNutrition'

    id = Column(Integer, primary_key=True, index=True)
    health_condition_id = Column(Integer, ForeignKey(
        "HealthConditions.id"))
    nutrition_id = Column(Integer, ForeignKey(
        'Nutritions.id'))
    adjusted_value = Column(String, nullable=False)
    
    health_condition = relationship(
        'HealthConditions', back_populates='afftect_nutrition', lazy='noload')
    nutrition = relationship(
        'Nutritions', back_populates='affected_by_health_condition', lazy='noload')