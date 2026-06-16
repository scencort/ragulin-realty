from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.review import Review
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewOut
from app.core.deps import get_current_admin

router = APIRouter()


@router.get("/", response_model=list[ReviewOut])
def list_reviews(published_only: bool = True, db: Session = Depends(get_db)):
    q = db.query(Review)
    if published_only:
        q = q.filter(Review.is_published == True)
    return q.order_by(Review.created_at.desc()).all()


@router.post("/", response_model=ReviewOut)
def create_review(data: ReviewCreate, db: Session = Depends(get_db)):
    review = Review(**data.model_dump(), is_published=False)
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


@router.get("/admin", response_model=list[ReviewOut], dependencies=[Depends(get_current_admin)])
def admin_list_reviews(db: Session = Depends(get_db)):
    return db.query(Review).order_by(Review.created_at.desc()).all()


@router.put("/{review_id}", response_model=ReviewOut, dependencies=[Depends(get_current_admin)])
def update_review(review_id: int, data: ReviewUpdate, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(review, k, v)
    db.commit()
    db.refresh(review)
    return review


@router.delete("/{review_id}", dependencies=[Depends(get_current_admin)])
def delete_review(review_id: int, db: Session = Depends(get_db)):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    db.delete(review)
    db.commit()
    return {"ok": True}
