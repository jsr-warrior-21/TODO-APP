from .database import Base
from sqlalchemy import  Column,Integer,String,ForeignKey, Boolean,DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func



class User(Base):
    __tablename__ = "users"
    id = Column(Integer,primary_key=True,index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255),unique=True,nullable=False,index=True)
    password = Column(String(255),nullable=False)

    tasks = relationship("Task",back_populates="creator",cascade="all, delete-orphan",lazy="selectin")

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer,primary_key=True,index=True)
    title = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer,ForeignKey('users.id'))
    is_important = Column(Boolean, default=False)
    due_date = Column(DateTime(timezone=True), nullable=True)

    creator = relationship("User",back_populates="tasks",lazy = "selectin")



