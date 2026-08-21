from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime
from typing import Optional


class CourseCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10)
    price: Decimal = Field(ge=0)
    level: str = "Beginner"
    thumbnail_emoji: Optional[str] = "📘"


class CourseOut(BaseModel):
    id: str
    title: str
    description: str
    price: Decimal
    level: str
    thumbnail_emoji: str
    instructor_id: str
    instructor_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedCourses(BaseModel):
    items: list[CourseOut]
    total: int
    page: int
    limit: int
