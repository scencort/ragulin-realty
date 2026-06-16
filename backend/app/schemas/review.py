from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import datetime


class ReviewCreate(BaseModel):
    client_name: str
    text: str
    rating: int = 5

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class ReviewUpdate(BaseModel):
    client_name: Optional[str] = None
    text: Optional[str] = None
    rating: Optional[int] = None
    is_published: Optional[bool] = None


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    client_name: str
    text: str
    rating: int
    is_published: bool
    created_at: datetime
