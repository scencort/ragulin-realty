import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.router import api_router
from app.core.config import settings

app = FastAPI(
    title="Рагулин Роман — Эксперт по недвижимости",
    description="API платформы персонального бренда риэлтора",
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
    from app.db.session import SessionLocal
    from app.models.user import User
    from app.core.security import get_password_hash
    from app.models.seo import SEOPage

    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if not admin:
            admin = User(
                email=settings.ADMIN_EMAIL,
                password_hash=get_password_hash(settings.ADMIN_PASSWORD),
                role="admin",
            )
            db.add(admin)
            db.commit()

        pages = ["home", "catalog", "about", "reviews", "contacts"]
        defaults = {
            "home": {
                "meta_title": "Рагулин Роман — Эксперт по недвижимости в Москве | Этажи",
                "meta_description": "Ведущий эксперт по недвижимости компании «Этажи» в Москве. Покупка, продажа и аренда квартир, домов и коммерческой недвижимости.",
            },
            "catalog": {
                "meta_title": "Каталог объектов недвижимости — Рагулин Роман",
                "meta_description": "Актуальные объекты недвижимости в Москве. Квартиры, дома, коммерческая недвижимость.",
            },
            "about": {
                "meta_title": "О специалисте — Рагулин Роман Александрович",
                "meta_description": "Биография, достижения и опыт ведущего эксперта по недвижимости компании «Этажи».",
            },
            "reviews": {
                "meta_title": "Отзывы клиентов — Рагулин Роман",
                "meta_description": "Отзывы клиентов о работе с Рагулиным Романом Александровичем.",
            },
            "contacts": {
                "meta_title": "Контакты — Рагулин Роман, Москва",
                "meta_description": "Свяжитесь с Рагулиным Романом. Москва, Балтийская 9. Тел: +7 910 277-52-12.",
            },
        }
        for page in pages:
            if not db.query(SEOPage).filter(SEOPage.page == page).first():
                seo = SEOPage(page=page, **defaults.get(page, {}))
                db.add(seo)
        db.commit()
    finally:
        db.close()
