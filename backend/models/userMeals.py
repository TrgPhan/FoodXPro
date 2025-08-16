from sqlalchemy import Integer, Column, ForeignKey, DATETIME, String,func
from sqlalchemy.orm import relationship
from db import Base


class UserMeals(Base):
    __tablename__ = 'UserMeals'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(
        "Users.id"))
    recipe_id = Column(Integer, ForeignKey(
        'Recipes.id'))
    servings_eaten = Column(Integer, default=1)
    eat_date = Column(DATETIME, default=func.now())
    eat_at = Column(String, nullable=True)

    user = relationship(
        'Users', back_populates='user_meals', lazy='noload')
    recipe = relationship(
        'Recipes', back_populates='user_ate_meal', lazy='noload')