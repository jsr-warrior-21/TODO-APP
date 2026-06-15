from pydantic import BaseModel , ConfigDict ,  EmailStr ,Field , field_validator
from typing import List , Optional
from datetime import datetime

import re


class TaskBase(BaseModel):
    # Field se hum strict validation aur example data de sakte hain (Swagger UI ke liye)
    title: str = Field(..., max_length=255,min_length=1, examples=["Complete Maths assignment"])
    description: Optional[str] = Field(None, max_length=500, examples=["Finish Calculus portion before Monday"])
    is_important: Optional[bool] = False
    due_date: Optional[datetime] = None
    @field_validator("due_date", mode="before")
    @classmethod
    def parse_due_date(cls, value):
        if isinstance(value, str):
            try:
                # Try full datetime
                return datetime.fromisoformat(value)
            except:
                try:
                    # Try only date
                    return datetime.strptime(value, "%Y-%m-%d")
                except:
                    raise ValueError("Invalid date format. Use YYYY-MM-DD or YYYY-MM-DD HH:MM")
        return value
class CreateTask(TaskBase):
    # User se task banate waqt sirf title aur description lenge
    pass


class ShowTask(TaskBase):
    # Output schema: Jab API data return karegi toh yeh sab dikhega
    id: int
    completed: bool
    created_at: datetime
    user_id: int

    # Pydantic V2 ka tareeka SQLAlchemy objects ko JSON me convert karne ka
    model_config = ConfigDict(from_attributes=True)



# USER SCHEMA


class User(BaseModel):
    name: str = Field(..., max_length=255,min_length=1)
    # EmailStr automatically check karega ki email valid format (user@domain.com) me hai ya nahi
    email:EmailStr = Field(max_length=255,examples=["user@gmail.com"])


class CreateUser(User):
    # Register karte waqt user password dega
    password: str = Field(..., min_length=8,max_length=64,examples=["Strongpass123@"])    
    # 🔐 Custom password validation
    @field_validator("password")
    @classmethod
    def validate_password(cls, value):
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter")

        if not re.search(r"[a-z]", value):
            raise ValueError("Password must contain at least one lowercase letter")

        if not re.search(r"[0-9]", value):
            raise ValueError("Password must contain at least one digit")

        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            raise ValueError("Password must contain at least one special character")

        return value
    

class ShowUser(BaseModel):
    id:int
    name:str
    email:str
    tasks: List[ShowTask] =Field(default_factory=list) #User ki list of tasks automatically populate hogi

    model_config = ConfigDict(from_attributes=True)


# AUTHENTICATION SCHEMAS


class Login(BaseModel):
    email:EmailStr
    password:str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
