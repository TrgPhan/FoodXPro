from sqlalchemy import Integer, Column, ForeignKey
from sqlalchemy.orm import relationship
from db import Base


class UserHealthConditions(Base):
    __tablename__ = 'UserHealthConditions'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey(
        "Users.id"))
    health_condition_id = Column(Integer, ForeignKey(
        'HealthConditions.id'))
    
    user = relationship(
        'Users', back_populates='user_health_conditions', lazy='noload')
    health_condition = relationship(
        'HealthConditions', back_populates='user_has_health_condition', lazy='noload')