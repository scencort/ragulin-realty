from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class SEOPageUpdate(BaseModel):
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image: Optional[str] = None


class SEOPageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    page: str
    meta_title: Optional[str]
    meta_description: Optional[str]
    og_title: Optional[str]
    og_description: Optional[str]
    og_image: Optional[str]
    updated_at: datetime
