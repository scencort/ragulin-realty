from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.seo import SEOPage
from app.schemas.seo import SEOPageUpdate, SEOPageOut
from app.core.deps import get_current_admin

router = APIRouter()

PAGES = ["home", "catalog", "about", "reviews", "contacts"]


@router.get("/", response_model=list[SEOPageOut], dependencies=[Depends(get_current_admin)])
def list_seo(db: Session = Depends(get_db)):
    return db.query(SEOPage).all()


@router.get("/{page}", response_model=SEOPageOut)
def get_seo(page: str, db: Session = Depends(get_db)):
    row = db.query(SEOPage).filter(SEOPage.page == page).first()
    if not row:
        raise HTTPException(status_code=404, detail="SEO page not found")
    return row


@router.put("/{page}", response_model=SEOPageOut, dependencies=[Depends(get_current_admin)])
def upsert_seo(page: str, data: SEOPageUpdate, db: Session = Depends(get_db)):
    row = db.query(SEOPage).filter(SEOPage.page == page).first()
    if not row:
        row = SEOPage(page=page)
        db.add(row)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row
