import httpx
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

TELEGRAM_TOKEN = "8806874286:AAE--TEvIYvl8ojDACjD_vpqGhin6S_RcKo"
TELEGRAM_CHAT_ID = "540311740"


class QuizData(BaseModel):
    deal_type: str
    property_type: str
    rooms: Optional[str] = None
    area_from: Optional[int] = None
    area_to: Optional[int] = None
    year_built: Optional[str] = None
    renovation: Optional[str] = None
    payment: str
    monthly_payment: Optional[int] = None
    down_payment: Optional[int] = None
    wishes: Optional[str] = None
    name: str
    phone: str


def fmt(label: str, value: Optional[str]) -> str:
    if not value:
        return ""
    return f"\n• {label}: {value}"


@router.post("/quiz")
async def submit_quiz(data: QuizData):
    lines = [
        "🏠 *Новая заявка на подбор недвижимости*",
        "",
        f"👤 *{data.name}*",
        f"📞 {data.phone}",
        "",
        "─────────────────",
    ]

    lines.append(fmt("Сделка", data.deal_type))
    lines.append(fmt("Тип", data.property_type))

    if data.rooms:
        lines.append(fmt("Комнат", data.rooms))

    area_parts = []
    if data.area_from:
        area_parts.append(f"от {data.area_from}")
    if data.area_to:
        area_parts.append(f"до {data.area_to}")
    if area_parts:
        lines.append(fmt("Площадь, м²", " ".join(area_parts)))

    lines.append(fmt("Год постройки", data.year_built))
    lines.append(fmt("Отделка", data.renovation))
    lines.append(fmt("Оплата", data.payment))

    if data.monthly_payment:
        lines.append(fmt("Комфортный платёж", f"{data.monthly_payment:,} ₽/мес".replace(",", " ")))
    if data.down_payment:
        lines.append(fmt("Первоначальный взнос", f"{data.down_payment:,} ₽".replace(",", " ")))

    if data.wishes:
        lines.append(f"\n💬 *Пожелания:* {data.wishes}")

    text = "\n".join(l for l in lines if l is not None)

    async with httpx.AsyncClient() as client:
        await client.post(
            f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
            json={"chat_id": TELEGRAM_CHAT_ID, "text": text, "parse_mode": "Markdown"},
            timeout=10,
        )

    return {"ok": True}
