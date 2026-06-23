from sqlalchemy import Column, Integer, String, Numeric, Text, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum


class PropertyType(str, enum.Enum):
    apartment = "apartment"
    house = "house"
    commercial = "commercial"
    land = "land"
    garage = "garage"
    townhouse = "townhouse"


class PropertyStatus(str, enum.Enum):
    sale = "sale"
    rent = "rent"
    sold = "sold"
    rented = "rented"


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    slug = Column(String(600), unique=True, nullable=False, index=True)
    property_type = Column(Enum(PropertyType), nullable=False)
    status = Column(Enum(PropertyStatus), nullable=False, default=PropertyStatus.sale)
    price = Column(Numeric(15, 2), nullable=False)
    area = Column(Numeric(8, 2), nullable=False)
    rooms = Column(Integer, nullable=True)
    floor = Column(Integer, nullable=True)
    total_floors = Column(Integer, nullable=True)
    address = Column(String(500), nullable=False)
    district = Column(String(200), nullable=False)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    description = Column(Text, nullable=True)
    advantages = Column(JSON, nullable=True, default=list)
    renovation  = Column(String(100), nullable=True)
    year_built  = Column(Integer, nullable=True)
    cian_url    = Column(String(500), nullable=True)
    is_featured = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    images = relationship("PropertyImage", back_populates="property", cascade="all, delete-orphan", order_by="PropertyImage.sort_order")


class PropertyImage(Base):
    __tablename__ = "property_images"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    image_path = Column(String(500), nullable=False)
    sort_order = Column(Integer, default=0)

    property = relationship("Property", back_populates="images")
