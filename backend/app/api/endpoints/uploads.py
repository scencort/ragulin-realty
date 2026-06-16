import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from PIL import Image
from app.db.session import get_db
from app.models.property import Property, PropertyImage
from app.schemas.property import PropertyImageOut
from app.core.deps import get_current_admin
from app.core.config import settings

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_SIZE = 15 * 1024 * 1024  # 15 MB


def save_as_webp(file: UploadFile, dest_dir: str) -> str:
    os.makedirs(dest_dir, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.webp"
    dest_path = os.path.join(dest_dir, filename)
    img = Image.open(file.file)
    img = img.convert("RGB")
    img.save(dest_path, "WEBP", quality=85, optimize=True)
    return dest_path


@router.post("/{property_id}/images", response_model=PropertyImageOut, dependencies=[Depends(get_current_admin)])
async def upload_image(
    property_id: int,
    sort_order: int = Form(default=0),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type")
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    await file.seek(0)

    dest_dir = os.path.join(settings.UPLOAD_DIR, "properties", str(property_id))
    path = save_as_webp(file, dest_dir)
    relative_path = path.replace("\\", "/")

    img = PropertyImage(property_id=property_id, image_path=relative_path, sort_order=sort_order)
    db.add(img)
    db.commit()
    db.refresh(img)
    return img
