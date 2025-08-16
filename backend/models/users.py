from sqlalchemy import Integer, Column, Text, String, DateTime, Float, func
from sqlalchemy.orm import relationship
from db import Base


class Users(Base):
    __tablename__ = 'Users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(Text, nullable=False, index=True)
    email = Column(Text, nullable=False)
    full_name = Column(Text, nullable=False)
    hashed_password = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())
    last_active_at = Column(DateTime, default=None)
    age = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)
    height = Column(Float, nullable=True)
    goal = Column(String, nullable=True)
    sex = Column(String, nullable=True)
    activity_level = Column(String, nullable=True)

    user_ingredients = relationship(
        'UserIngredients', back_populates='user', lazy='noload')
    user_meals = relationship(
        'UserMeals', back_populates='user', lazy='noload')
    user_health_conditions = relationship(
        'UserHealthConditions', back_populates='user', lazy='noload')
    user_allergies = relationship(
        'UserAllergies', back_populates='user', lazy='noload')