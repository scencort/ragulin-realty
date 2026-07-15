import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.router import api_router
from app.core.config import settings

logger = logging.getLogger(__name__)

app = FastAPI(
    title="\u0420\u0430\u0433\u0443\u043b\u0438\u043d \u0420\u043e\u043c\u0430\u043d \u2014 \u044d\u043a\u0441\u043f\u0435\u0440\u0442 \u043f\u043e \u043d\u0435\u0434\u0432\u0438\u0436\u0438\u043c\u043e\u0441\u0442\u0438",
    description="API \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u044b \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u043b\u044c\u043d\u043e\u0433\u043e \u0431\u0440\u0435\u043d\u0434\u0430 \u0440\u0438\u0435\u043b\u0442\u043e\u0440\u0430",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static/uploads/properties", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
def startup_event():
    from sqlalchemy.exc import IntegrityError
    from app.db.session import SessionLocal
    from app.models.user import User
    from app.core.security import get_password_hash
    from app.models.seo import SEOPage

    db = SessionLocal()
    try:
        if settings.AUTO_CREATE_ADMIN:
            admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
            if not admin:
                admin = User(
                    email=settings.ADMIN_EMAIL,
                    password_hash=get_password_hash(settings.ADMIN_PASSWORD),
                    role="admin",
                )
                db.add(admin)
                try:
                    db.commit()
                except IntegrityError:
                    # Another worker process created the admin user concurrently; ignore it.
                    db.rollback()
        else:
            logger.info("AUTO_CREATE_ADMIN is disabled; skipping admin bootstrap.")

        pages = ["home", "catalog", "about", "reviews", "contacts"]
        defaults = {
            "home": {
                "meta_title": "\u0420\u0430\u0433\u0443\u043b\u0438\u043d \u0420\u043e\u043c\u0430\u043d \u2014 \u044d\u043a\u0441\u043f\u0435\u0440\u0442 \u043f\u043e \u043d\u0435\u0434\u0432\u0438\u0436\u0438\u043c\u043e\u0441\u0442\u0438 \u0432 \u041c\u043e\u0441\u043a\u0432\u0435 | \u042d\u0442\u0430\u0436\u0438",
                "meta_description": "\u0412\u0435\u0434\u0443\u0449\u0438\u0439 \u044d\u043a\u0441\u043f\u0435\u0440\u0442 \u043f\u043e \u043d\u0435\u0434\u0432\u0438\u0436\u0438\u043c\u043e\u0441\u0442\u0438 \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438 \u00ab\u042d\u0442\u0430\u0436\u0438\u00bb \u0432 \u041c\u043e\u0441\u043a\u0432\u0435. \u041f\u043e\u043a\u0443\u043f\u043a\u0430, \u043f\u0440\u043e\u0434\u0430\u0436\u0430 \u0438 \u0430\u0440\u0435\u043d\u0434\u0430 \u043a\u0432\u0430\u0440\u0442\u0438\u0440, \u0434\u043e\u043c\u043e\u0432 \u0438 \u043a\u043e\u043c\u043c\u0435\u0440\u0447\u0435\u0441\u043a\u043e\u0439 \u043d\u0435\u0434\u0432\u0438\u0436\u0438\u043c\u043e\u0441\u0442\u0438.",
            },
            "catalog": {
                "meta_title": "\u041a\u0430\u0442\u0430\u043b\u043e\u0433 \u043e\u0431\u044a\u0435\u043a\u0442\u043e\u0432 \u043d\u0435\u0434\u0432\u0438\u0436\u0438\u043c\u043e\u0441\u0442\u0438 \u2014 \u0420\u0430\u0433\u0443\u043b\u0438\u043d \u0420\u043e\u043c\u0430\u043d",
                "meta_description": "\u0410\u043a\u0442\u0443\u0430\u043b\u044c\u043d\u044b\u0435 \u043e\u0431\u044a\u0435\u043a\u0442\u044b \u043d\u0435\u0434\u0432\u0438\u0436\u0438\u043c\u043e\u0441\u0442\u0438 \u0432 \u041c\u043e\u0441\u043a\u0432\u0435. \u041a\u0432\u0430\u0440\u0442\u0438\u0440\u044b, \u0434\u043e\u043c\u0430, \u043a\u043e\u043c\u043c\u0435\u0440\u0447\u0435\u0441\u043a\u0430\u044f \u043d\u0435\u0434\u0432\u0438\u0436\u0438\u043c\u043e\u0441\u0442\u044c.",
            },
            "about": {
                "meta_title": "\u041e \u0441\u043f\u0435\u0446\u0438\u0430\u043b\u0438\u0441\u0442\u0435 \u2014 \u0420\u0430\u0433\u0443\u043b\u0438\u043d \u0420\u043e\u043c\u0430\u043d \u0410\u043b\u0435\u043a\u0441\u0430\u043d\u0434\u0440\u043e\u0432\u0438\u0447",
                "meta_description": "\u0411\u0438\u043e\u0433\u0440\u0430\u0444\u0438\u044f, \u0434\u043e\u0441\u0442\u0438\u0436\u0435\u043d\u0438\u044f \u0438 \u043e\u043f\u044b\u0442 \u0432\u0435\u0434\u0443\u0449\u0435\u0433\u043e \u044d\u043a\u0441\u043f\u0435\u0440\u0442\u0430 \u043f\u043e \u043d\u0435\u0434\u0432\u0438\u0436\u0438\u043c\u043e\u0441\u0442\u0438 \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438 \u00ab\u042d\u0442\u0430\u0436\u0438\u00bb.",
            },
            "reviews": {
                "meta_title": "\u041e\u0442\u0437\u044b\u0432\u044b \u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432 \u2014 \u0420\u0430\u0433\u0443\u043b\u0438\u043d \u0420\u043e\u043c\u0430\u043d",
                "meta_description": "\u041e\u0442\u0437\u044b\u0432\u044b \u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432 \u043e \u0440\u0430\u0431\u043e\u0442\u0435 \u0441 \u0420\u0430\u0433\u0443\u043b\u0438\u043d\u044b\u043c \u0420\u043e\u043c\u0430\u043d\u043e\u043c \u0410\u043b\u0435\u043a\u0441\u0430\u043d\u0434\u0440\u043e\u0432\u0438\u0447\u0435\u043c.",
            },
            "contacts": {
                "meta_title": "\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u044b \u2014 \u0420\u0430\u0433\u0443\u043b\u0438\u043d \u0420\u043e\u043c\u0430\u043d, \u041c\u043e\u0441\u043a\u0432\u0430",
                "meta_description": "\u0421\u0432\u044f\u0436\u0438\u0442\u0435\u0441\u044c \u0441 \u0420\u0430\u0433\u0443\u043b\u0438\u043d\u044b\u043c \u0420\u043e\u043c\u0430\u043d\u043e\u043c. \u041c\u043e\u0441\u043a\u0432\u0430, \u0411\u0430\u043b\u0442\u0438\u0439\u0441\u043a\u0430\u044f 9. \u0422\u0435\u043b: +7 910 277-52-12.",
            },
        }
        for page in pages:
            if not db.query(SEOPage).filter(SEOPage.page == page).first():
                seo = SEOPage(page=page, **defaults.get(page, {}))
                db.add(seo)
        try:
            db.commit()
        except IntegrityError:
            # Another worker process created the same SEO pages concurrently; ignore it.
            db.rollback()
    finally:
        db.close()
