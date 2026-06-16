from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.db.base import Base


class SEOPage(Base):
    __tablename__ = "seo_pages"

    id = Column(Integer, primary_key=True, index=True)
    page = Column(String(100), unique=True, nullable=False, index=True)
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(String(500), nullable=True)
    og_title = Column(String(200), nullable=True)
    og_description = Column(String(500), nullable=True)
    og_image = Column(String(500), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
