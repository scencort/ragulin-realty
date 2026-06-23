import httpx
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

TELEGRAM_TOKEN = "8806874286:AAE--TEvIYvl8ojDACjD_vpqGhin6S_RcKo"
TELEGRAM_CHAT_ID = "540311740"


class QuizData(BaseModel):
    deal_type: str
    property_type: Optional[str] = None
    rooms: Optional[str] = None
    area_from: Optional[int] = None
    area_to: Optional[int] = None
    year_built: Optional[str] = None
    renovation: Optional[str] = None
    # Купить
    payment: Optional[str] = None
    prop_price: Optional[int] = None
    down_payment: Optional[int] = None
    term_years: Optional[int] = None
    # Продать
    district: Optional[str] = None
    desired_price: Optional[int] = None
    # Снять
    rent_budget: Optional[int] = None
    # Общее
    wishes: Optional[str] = None
    name: str
    phone: str


def line(label: str, value) -> str:
    if not value:
        return ""
    return f"\n• {label}: {value}"


@router.post("/quiz")
async def submit_quiz(data: QuizData):
    emoji = {"Купить": "🏠", "Продать": "💰", "Снять": "🔑"}.get(data.deal_type, "📋")

    rows = [
        f"{emoji} *Новая заявка — {data.deal_type}*",
        "",
        f"👤 *{data.name}*",
        f"📞 {data.phone}",
        "",
        "─────────────────",
    ]

    if data.property_type:
        rows.append(line("Тип", data.property_type))
    if data.rooms:
        rows.append(line("Комнат", data.rooms))

    area_parts = []
    if data.area_from:
        area_parts.append(f"от {data.area_from}")
    if data.area_to:
        area_parts.append(f"до {data.area_to}")
    if area_parts:
        rows.append(line("Площадь, м²", " ".join(area_parts)))

    if data.year_built:
        rows.append(line("Год постройки", data.year_built))
    if data.renovation:
        rows.append(line("Отделка", data.renovation))

    # Купить
    if data.payment:
        rows.append(line("Оплата", data.payment))
    if data.prop_price:
        rows.append(line("Стоимость", f"{data.prop_price:,} ₽".replace(",", " ")))
    if data.down_payment:
        rows.append(line("Взнос", f"{data.down_payment:,} ₽".replace(",", " ")))
    if data.term_years:
        rows.append(line("Срок ипотеки", f"{data.term_years} лет"))

    # Продать
    if data.district:
        rows.append(line("Район / адрес", data.district))
    if data.desired_price:
        rows.append(line("Желаемая цена", f"{data.desired_price:,} ₽".replace(",", " ")))

    # Снять
    if data.rent_budget:
        rows.append(line("Бюджет аренды", f"{data.rent_budget:,} ₽/мес".replace(",", " ")))

    if data.wishes:
        rows.append(f"\n💬 *Пожелания:* {data.wishes}")

    text = "\n".join(r for r in rows if r is not None)

    async with httpx.AsyncClient() as client:
        await client.post(
            f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
            json={"chat_id": TELEGRAM_CHAT_ID, "text": text, "parse_mode": "Markdown"},
            timeout=10,
        )

    return {"ok": True}
