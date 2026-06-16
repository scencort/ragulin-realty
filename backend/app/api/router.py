from fastapi import APIRouter
from app.api.endpoints import auth, properties, reviews, seo, uploads, parse

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(parse.router, prefix="/properties", tags=["parse"])
api_router.include_router(properties.router, prefix="/properties", tags=["properties"])
api_router.include_router(reviews.router, prefix="/reviews", tags=["reviews"])
api_router.include_router(seo.router, prefix="/seo", tags=["seo"])
api_router.include_router(uploads.router, prefix="/properties", tags=["uploads"])
