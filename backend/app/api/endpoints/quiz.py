import httpx
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import re

router = APIRouter()

TELEGRAM_TOKEN = "8806874286:AAE--TEvIYvl8ojDACjD_vpqGhin6S_RcKo"
TELEGRAM_CHAT_ID = "540311740"


class QuizData(BaseModel):
    deal_type: str
    property_type: Optional[str] = None
    rooms: Optional[str] = None
    land_type: Optional[str] = None
    commercial_type: Optional[str] = None
    heated: Optional[str] = None
    area_from: Optional[int] = None
    area_to: Optional[int] = None
    year_built: Optional[str] = None
    renovation: Optional[str] = None
    payment: Optional[str] = None
    prop_price: Optional[int] = None
    down_payment: Optional[int] = None
    term_years: Optional[int] = None
    district: Optional[str] = None
    desired_price: Optional[int] = None
    rent_budget: Optional[int] = None
    wishes: Optional[str] = None
    name: str
    phone: str


def esc(text: str) -> str:
    """Escape special chars for MarkdownV2."""
    return re.sub(r'([_*\[\]()~`>#+\-=|{}.!\\])', r'\\\1', str(text))


def money(n: int) -> str:
    return f"{n:,}".replace(",", " ")  # narrow no-break space


@router.post("/quiz")
async def submit_quiz(data: QuizData):
    deal_emoji = {"Купить": "🏠", "Продать": "💰", "Снять": "🔑"}.get(data.deal_type, "📋")

    rows: list[str] = []

    # ── Header ──
    rows.append(f"{deal_emoji} *{esc(data.deal_type)} недвижимость*")
    rows.append("")
    rows.append(f"👤 *{esc(data.name)}*")
    rows.append(f"📞 `{esc(data.phone)}`")
    rows.append("")
    rows.append("━━━━━━━━━━━━━━━━━")
    rows.append("")

    def row(icon: str, label: str, value) -> None:
        if value:
            rows.append(f"{icon} {esc(label)}: *{esc(str(value))}*")

    row("🏢", "Тип",            data.property_type)
    row("🚪", "Комнат",         data.rooms)
    row("🌿", "Назначение участка", data.land_type)
    row("🏬", "Тип коммерции",     data.commercial_type)
    row("🔥", "Отопление",         data.heated)

    # Area
    area_parts = []
    if data.area_from: area_parts.append(f"от {data.area_from}")
    if data.area_to:   area_parts.append(f"до {data.area_to}")
    if area_parts:
        rows.append(f"📐 {esc('Площадь')}: *{esc(' '.join(area_parts))} м²*")

    row("🏗", "Год постройки",  data.year_built)
    row("🎨", "Отделка",        data.renovation)

    # Купить
    row("💳", "Способ оплаты", data.payment)

    if data.prop_price:
        rows.append(f"💵 {esc('Стоимость')}: *{esc(money(data.prop_price))} ₽*")
    if data.down_payment:
        rows.append(f"🏦 {esc('Первоначальный взнос')}: *{esc(money(data.down_payment))} ₽*")
    if data.term_years:
        rows.append(f"📅 {esc('Срок ипотеки')}: *{esc(str(data.term_years))} лет*")

    # Ипотечный расчёт
    if data.payment == "Ипотека" and data.prop_price and data.down_payment and data.term_years:
        loan = data.prop_price - data.down_payment
        if loan > 0:
            rows.append("")
            rows.append("📊 *Примерный платёж по ипотеке:*")

            programs = [
                ("Рыночная",    28.5),
                ("Семейная",     6.0),
                ("IT\\-ипотека", 6.0),
            ]
            n = data.term_years * 12
            for name_p, rate in programs:
                r = rate / 100 / 12
                if r == 0:
                    m = loan // n
                else:
                    m = round(loan * r * (1 + r) ** n / ((1 + r) ** n - 1))
                icon = "🟢" if rate < 10 else "🔴"
                rows.append(f"  {icon} {name_p} \\({rate}%\\) — *{esc(money(m))} ₽/мес*")

    # Продать
    row("📍", "Район / адрес",  data.district)
    if data.desired_price:
        rows.append(f"🏷 {esc('Желаемая цена')}: *{esc(money(data.desired_price))} ₽*")

    # Снять
    if data.rent_budget:
        rows.append(f"💸 {esc('Бюджет аренды')}: *{esc(money(data.rent_budget))} ₽/мес*")

    # Пожелания
    if data.wishes:
        rows.append("")
        rows.append(f"💬 *Пожелания:*")
        rows.append(f"_{esc(data.wishes)}_")

    text = "\n".join(rows)

    async with httpx.AsyncClient() as client:
        await client.post(
            f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
            json={"chat_id": TELEGRAM_CHAT_ID, "text": text, "parse_mode": "MarkdownV2"},
            timeout=10,
        )

    return {"ok": True}
