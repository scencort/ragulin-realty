from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from decimal import Decimal
from slugify import slugify
from app.db.session import get_db
from app.models.property import Property, PropertyImage, PropertyType, PropertyStatus
from app.schemas.property import (
    PropertyCreate, PropertyUpdate, PropertyOut,
    PropertyListOut, PropertiesResponse,
)
from app.core.deps import get_current_admin

router = APIRouter()


def generate_unique_slug(db: Session, title: str, exclude_id: Optional[int] = None) -> str:
    base = slugify(title, allow_unicode=False)
    slug, counter = base, 1
    while True:
        q = db.query(Property).filter(Property.slug == slug)
        if exclude_id:
            q = q.filter(Property.id != exclude_id)
        if not q.first():
            return slug
        slug = f"{base}-{counter}"
        counter += 1


@router.get("/", response_model=PropertiesResponse)
def list_properties(
    property_type: Optional[PropertyType] = None,
    district: Optional[str] = None,
    rooms: Optional[int] = None,
    price_min: Optional[Decimal] = None,
    price_max: Optional[Decimal] = None,
    area_min: Optional[Decimal] = None,
    area_max: Optional[Decimal] = None,
    is_featured: Optional[int] = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=500),
    db: Session = Depends(get_db),
):
    # Only show properties for sale on the public API
    q = db.query(Property).filter(Property.status == PropertyStatus.sale)
    if property_type:
        q = q.filter(Property.property_type == property_type)
    if district:
        q = q.filter(Property.district.ilike(f"%{district}%"))
    if rooms is not None:
        q = q.filter(Property.rooms == rooms)
    if price_min is not None:
        q = q.filter(Property.price >= price_min)
    if price_max is not None:
        q = q.filter(Property.price <= price_max)
    if area_min is not None:
        q = q.filter(Property.area >= area_min)
    if area_max is not None:
        q = q.filter(Property.area <= area_max)
    if is_featured is not None:
        q = q.filter(Property.is_featured == is_featured)
    total = q.count()
    items = q.order_by(Property.created_at.desc()).offset(skip).limit(limit).all()
    return PropertiesResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/featured", response_model=list[PropertyListOut])
def get_featured(limit: int = 6, db: Session = Depends(get_db)):
    return (
        db.query(Property)
        .filter(Property.is_featured == 1, Property.status == PropertyStatus.sale)
        .order_by(Property.created_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/{slug}", response_model=PropertyOut)
def get_property(slug: str, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.slug == slug).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


@router.post("/", response_model=PropertyOut, dependencies=[Depends(get_current_admin)])
def create_property(data: PropertyCreate, db: Session = Depends(get_db)):
    slug = data.slug or generate_unique_slug(db, data.title)
    prop = Property(**data.model_dump(exclude={"slug"}), slug=slug)
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop


@router.put("/{property_id}", response_model=PropertyOut, dependencies=[Depends(get_current_admin)])
def update_property(property_id: int, data: PropertyUpdate, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    updates = data.model_dump(exclude_unset=True)
    if "title" in updates and "slug" not in updates:
        updates["slug"] = generate_unique_slug(db, updates["title"], exclude_id=property_id)
    for k, v in updates.items():
        setattr(prop, k, v)
    db.commit()
    db.refresh(prop)
    return prop


@router.delete("/{property_id}", dependencies=[Depends(get_current_admin)])
def delete_property(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    db.delete(prop)
    db.commit()
    return {"ok": True}


@router.put("/{property_id}/images/reorder", dependencies=[Depends(get_current_admin)])
def reorder_images(property_id: int, order: list[int], db: Session = Depends(get_db)):
    """Accept list of image IDs in desired order, update sort_order accordingly."""
    images = db.query(PropertyImage).filter(PropertyImage.property_id == property_id).all()
    index_map = {img.id: img for img in images}
    for position, image_id in enumerate(order):
        if image_id in index_map:
            index_map[image_id].sort_order = position
    db.commit()
    return {"ok": True}


@router.delete("/{property_id}/images/{image_id}", dependencies=[Depends(get_current_admin)])
def delete_property_image(property_id: int, image_id: int, db: Session = Depends(get_db)):
    img = db.query(PropertyImage).filter(
        PropertyImage.id == image_id,
        PropertyImage.property_id == property_id,
    ).first()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    import os
    if os.path.exists(img.image_path):
        os.remove(img.image_path)
    db.delete(img)
    db.commit()
    return {"ok": True}
