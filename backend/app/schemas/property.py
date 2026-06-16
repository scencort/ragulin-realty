from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from app.models.property import PropertyType, PropertyStatus


class PropertyImageBase(BaseModel):
    image_path: str
    sort_order: int = 0


class PropertyImageOut(PropertyImageBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    property_id: int


class PropertyBase(BaseModel):
    title: str
    property_type: PropertyType
    status: PropertyStatus
    price: Decimal
    area: Decimal
    rooms: Optional[int] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    address: str
    district: str
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    description: Optional[str] = None
    advantages: Optional[List[str]] = None
    cian_url: Optional[str] = None
    is_featured: int = 0


class PropertyCreate(PropertyBase):
    slug: Optional[str] = None


class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    property_type: Optional[PropertyType] = None
    status: Optional[PropertyStatus] = None
    price: Optional[Decimal] = None
    area: Optional[Decimal] = None
    rooms: Optional[int] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    address: Optional[str] = None
    district: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    description: Optional[str] = None
    advantages: Optional[List[str]] = None
    cian_url: Optional[str] = None
    is_featured: Optional[int] = None
    slug: Optional[str] = None


class PropertyOut(PropertyBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: str
    created_at: datetime
    updated_at: datetime
    images: List[PropertyImageOut] = []


class PropertyListOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    slug: str
    property_type: PropertyType
    status: PropertyStatus
    price: Decimal
    area: Decimal
    rooms: Optional[int]
    floor: Optional[int]
    total_floors: Optional[int]
    address: str
    district: str
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    description: Optional[str] = None
    advantages: Optional[List[str]] = None
    cian_url: Optional[str] = None
    is_featured: int
    created_at: datetime
    images: List[PropertyImageOut] = []


class PropertyFilterParams(BaseModel):
    property_type: Optional[PropertyType] = None
    status: Optional[PropertyStatus] = None
    district: Optional[str] = None
    rooms: Optional[int] = None
    price_min: Optional[Decimal] = None
    price_max: Optional[Decimal] = None
    area_min: Optional[Decimal] = None
    area_max: Optional[Decimal] = None
    is_featured: Optional[int] = None
    skip: int = 0
    limit: int = 20


class PropertiesResponse(BaseModel):
    items: List[PropertyListOut]
    total: int
    skip: int
    limit: int
