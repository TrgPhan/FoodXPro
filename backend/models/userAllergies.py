from sqlalchemy import Integer, Column, ForeignKey
from sqlalchemy.orm import relationship
from db import Base


class UserAllergies(Base):
    __tablename__ = 'UserAllergies'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(
        "Users.id"))
    allergy_id = Column(Integer, ForeignKey(
        'Allergies.id'))
    
    user = relationship(
        'Users', back_populates='user_allergies', lazy='noload')
    allergy = relationship(
        'Allergies', back_populates='user_has_allergy', lazy='noload')