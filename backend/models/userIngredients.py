from sqlalchemy import Integer, Column, ForeignKey, DATETIME, func
from sqlalchemy.orm import relationship
from db import Base


class UserIngredients(Base):
    __tablename__ = 'UserIngredients'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(
        "Users.id"))
    ingredient_id = Column(Integer, ForeignKey(
        'Ingredients.id'))
    added_at = Column(DATETIME, default=func.now())
    expire_at = Column(DATETIME, default=None)

    user = relationship(
        'Users', back_populates='user_ingredients', lazy='noload')
    ingredient = relationship(
        'Ingredients', back_populates='user_has_ingredient', lazy='noload')