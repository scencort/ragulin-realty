import logging
import httpx
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

TELEGRAM_TOKEN   = settings.TELEGRAM_TOKEN
TELEGRAM_CHAT_ID = settings.TELEGRAM_CHAT_ID


class QuizData(BaseModel):
    deal_type: str
    property_type: Optional[str] = None
    rooms: Optional[str] = None
    land_type: Optional[str] = None
    commercial_type: Optional[str] = None
    heated: Optional[str] = None
    house_plot_area: Optional[int] = None
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


def h(text: str) -> str:
    """Escape special chars for Telegram HTML."""
    return str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def money(n: int) -> str:
    return f"{n:,}".replace(",", " ")


EXTRA_CHAT_IDS = ["2142194221"]

async def send_telegram(text: str) -> None:
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        logger.error("Telegram credentials not configured")
        return
    chat_ids = [TELEGRAM_CHAT_ID] + EXTRA_CHAT_IDS
    try:
        async with httpx.AsyncClient() as client:
            for chat_id in chat_ids:
                resp = await client.post(
                    f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
                    json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
                    timeout=15,
                )
                if not resp.is_success or not resp.json().get("ok"):
                    logger.error("Telegram error (chat %s): %s %s", chat_id, resp.status_code, resp.text)
                else:
                    logger.info("Telegram message sent ok to %s", chat_id)
    except Exception as exc:
        logger.exception("Failed to send Telegram message: %s", exc)


@router.post("/quiz")
async def submit_quiz(data: QuizData, background_tasks: BackgroundTasks):
    deal_emoji = {"Купить": "🏠", "Продать": "💰", "Снять": "🔑"}.get(data.deal_type, "📋")

    rows: list[str] = []

    rows.append(f"{deal_emoji} <b>{h(data.deal_type)} недвижимость</b>")
    rows.append("")
    rows.append(f"👤 <b>{h(data.name)}</b>")
    rows.append(f"📞 <code>{h(data.phone)}</code>")
    rows.append("")
    rows.append("━━━━━━━━━━━━━━━━━")
    rows.append("")

    def row(icon: str, label: str, value) -> None:
        if value:
            rows.append(f"{icon} {h(label)}: <b>{h(str(value))}</b>")

    row("🏢", "Тип",                data.property_type)
    row("🚪", "Комнат",             data.rooms)
    row("🌿", "Назначение участка", data.land_type)
    row("🏬", "Тип коммерции",      data.commercial_type)
    row("🔥", "Отопление",          data.heated)

    area_parts = []
    if data.area_from: area_parts.append(f"от {data.area_from}")
    if data.area_to:   area_parts.append(f"до {data.area_to}")
    if area_parts:
        rows.append(f"📐 Площадь дома: <b>{h(' '.join(area_parts))} м²</b>")
    if data.house_plot_area:
        rows.append(f"🌱 Участок: <b>{h(str(data.house_plot_area))} соток</b>")

    row("🏗", "Год постройки", data.year_built)
    row("🎨", "Отделка",       data.renovation)
    row("💳", "Способ оплаты", data.payment)

    if data.prop_price:
        rows.append(f"💵 Стоимость: <b>{h(money(data.prop_price))} ₽</b>")
    if data.down_payment:
        rows.append(f"🏦 Первоначальный взнос: <b>{h(money(data.down_payment))} ₽</b>")
    if data.term_years:
        rows.append(f"📅 Срок ипотеки: <b>{h(str(data.term_years))} лет</b>")

    if data.payment == "Ипотека" and data.prop_price and data.down_payment and data.term_years:
        loan = data.prop_price - data.down_payment
        if loan > 0:
            rows.append("")
            rows.append("📊 <b>Примерный платёж по ипотеке:</b>")
            programs = [
                ("Рыночная",   28.5),
                ("Семейная",    6.0),
                ("IT-ипотека",  6.0),
            ]
            n = data.term_years * 12
            for name_p, rate in programs:
                r = rate / 100 / 12
                m = round(loan * r * (1 + r) ** n / ((1 + r) ** n - 1)) if r else loan // n
                icon = "🟢" if rate < 10 else "🔴"
                rows.append(f"  {icon} {h(name_p)} ({rate}%) — <b>{h(money(m))} ₽/мес</b>")

    row("📍", "Район / адрес", data.district)
    if data.desired_price:
        rows.append(f"🏷 Желаемая цена: <b>{h(money(data.desired_price))} ₽</b>")
    if data.rent_budget:
        rows.append(f"💸 Бюджет аренды: <b>{h(money(data.rent_budget))} ₽/мес</b>")

    if data.wishes:
        rows.append("")
        rows.append("💬 <b>Пожелания:</b>")
        rows.append(f"<i>{h(data.wishes)}</i>")

    text = "\n".join(rows)
    background_tasks.add_task(send_telegram, text)
    return {"ok": True}
