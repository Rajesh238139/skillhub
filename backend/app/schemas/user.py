from pydantic import BaseModel, EmailStr, Field
from typing import Literal


class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    role: Literal["student", "instructor"] = "student"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


class TokenPair(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
