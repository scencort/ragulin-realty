"""
=============================================================
  ЦИАН ПАРСЕР — универсальный загрузчик объектов в БД
=============================================================

Использование:
    python parse_cian.py <URL>
    python parse_cian.py https://www.cian.ru/sale/flat/123/
    python parse_cian.py https://korolev.cian.ru/sale/flat/456/

Что делает:
  1. Открывает Edge (или Chrome) — без headless, чтобы пройти капчу
  2. Скроллит страницу — загружает все ленивые фото
  3. Извлекает данные 3 методами (JSON-LD → DOM → regex по тексту)
  4. Скачивает все фото в static/uploads/properties/
  5. Показывает что нашёл — даёт исправить вручную если что-то не так
  6. Сохраняет в БД

Зависимости (в venv уже есть):
    pip install playwright httpx
"""

import asyncio
import hashlib
import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

# ── Константы ──────────────────────────────────────────────────────────────
UPLOAD_DIR = Path("static/uploads/properties")
SKIP_IMAGE_KEYWORDS = {
    "icon", "logo", "promo", "banner", "header", "frontend",
    "avatar", "sprite", "placeholder", "favicon", "watermark",
    "newbuilding", "novostroyka", "kvartira-", "ulica-",
    "oferta", "offer-card",
}

MAX_PHOTOS = 50  # take up to 50 unique photos per listing


# ══════════════════════════════════════════════════════════════════════════════
#  UTILS
# ══════════════════════════════════════════════════════════════════════════════

def out(msg: str, color: str = "") -> None:
    """Print with ANSI color (safe for any encoding)."""
    codes = {
        "red": "\033[91m", "green": "\033[92m", "yellow": "\033[93m",
        "cyan": "\033[96m", "bold": "\033[1m", "dim": "\033[2m",
    }
    reset = "\033[0m"
    try:
        print(f"{codes.get(color,'')}{msg}{reset}")
    except UnicodeEncodeError:
        print(msg.encode("ascii", "replace").decode())


def normalise_spaces(text: str) -> str:
    """Replace all unicode space variants with regular ASCII space."""
    import unicodedata
    return "".join(" " if unicodedata.category(ch) in ("Zs", "Cf") else ch for ch in text)


# ══════════════════════════════════════════════════════════════════════════════
#  EXTRACTION HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def parse_price(text: str) -> float:
    """
    Extract listing price from page text.
    Strategy: find ALL prices >= 1M before ₽/руб, skip per-m² ones, return the FIRST.
    The listing price always appears near the top of the page.
    """
    t = normalise_spaces(text)
    RUBLE = chr(0x20BD)  # ₽

    candidates: list[tuple[int, float]] = []  # (position, value)

    # Pattern: "58 000 000 ₽"
    for m in re.finditer(r"(\d[\d ]{4,}\d)\s*(?:" + RUBLE + r"|руб)", t):
        ctx = t[max(0, m.start() - 80): m.end() + 80].lower()
        if re.search(r"за\s*м|за\s*кв|/\s*м|\bм2\b", ctx):
            continue
        try:
            val = float(re.sub(r"\s+", "", m.group(1)))
            if 500_000 <= val <= 2_000_000_000:
                candidates.append((m.start(), val))
        except ValueError:
            pass

    # Pattern: "58,5 млн"
    for m in re.finditer(r"(\d+[,.]?\d*)\s*млн", t, re.I):
        ctx = t[max(0, m.start() - 60): m.end() + 60].lower()
        if re.search(r"за\s*м|за\s*кв", ctx):
            continue
        try:
            val = float(m.group(1).replace(",", ".")) * 1_000_000
            if 500_000 <= val <= 2_000_000_000:
                candidates.append((m.start(), val))
        except ValueError:
            pass

    if not candidates:
        return 0.0
    # Sort by position — first occurrence is the listing price
    candidates.sort(key=lambda x: x[0])
    return candidates[0][1]


def parse_area(text: str) -> float:
    """Extract total area in m²."""
    m = re.search(r"(\d+[,.]\d+|\d+)\s*м[²2]", text)
    return float(m.group(1).replace(",", ".")) if m else 0.0


def parse_rooms(text: str) -> int | None:
    """Extract number of rooms."""
    m = re.search(r"(\d)\s*-?\s*(?:комн|комнат)", text, re.I)
    if m:
        return int(m.group(1))
    words = {"одно": 1, "двух": 2, "двум": 2, "трёх": 3, "трех": 3, "четырёх": 4, "четырех": 4}
    m = re.search(r"(одно|двух?|трёх|трех|четырёх|четырех)комнат", text, re.I)
    if m:
        return words.get(m.group(1).lower()[:5])
    return None


def parse_floor(text: str) -> tuple[int | None, int | None]:
    """Extract (floor, total_floors)."""
    # "4 из 21 этаж" or "4/21 эт" or "9/20"
    for pat in [
        r"(\d+)\s*/\s*(\d+)\s*(?:этаж|эт\.?)",
        r"(\d+)\s+из\s+(\d+)\s+(?:этаж|эт\.?)",
        r"(?:этаж|этаже|этажа)[^\d]*(\d+)[^\d]*(?:из|/)[^\d]*(\d+)",
        r"(\d+)\s*/\s*(\d+)(?=\s*эт)",
    ]:
        m = re.search(pat, text, re.I)
        if m:
            f, t = int(m.group(1)), int(m.group(2))
            if 1 <= f <= t <= 200:
                return f, t
    m = re.search(r"на\s+(\d+)\s+этаж", text, re.I)
    if m:
        return int(m.group(1)), None
    return None, None


def parse_address(page_title: str, page_text: str) -> tuple[str, str]:
    """
    Extract (address, district) from the page title.

    Cian page title formats:
      www.cian.ru:    "Продажа двухкомнатной квартиры 48.8м² Кутузовский проезд, 16А/1, Москва, ЗАО, р-н Дорогомилово м. Филёвский Парк"
      city.cian.ru:   "Купить двухкомнатную квартиру 69.5м² Пушкинская ул., 15, Королев, Московская область, мкр. Болшево м. Медведково - база ЦИАН, объявление 329709615"
    """
    address, district = "Не указан", "Не указан"

    title = page_title or ""
    # Strip trailing " - база ЦИАН, объявление XXXXXX"
    title = re.sub(r"\s*[-–—]\s*база ЦИАН.*$", "", title, flags=re.I).strip()
    # Strip leading "Продажа/Купить ... NNм² "
    title = re.sub(r"^(?:Продажа|Купить|Аренда)\s+.*?[\d,\.]+\s*м²\s*", "", title, flags=re.I).strip()

    if title:
        parts = [p.strip() for p in title.split(",")]
        addr_parts: list[str] = []
        STOP = re.compile(
            r"^(Москва|Московская\s+область|Санкт-Петербург|"
            r"ЗАО|ЦАО|ЮАО|ЮЗАО|СЗАО|СВАО|ЮВАО|ВАО|САО|ЗелАО|"
            r"р-н|округ|мкр\.?|м\.)$",
            re.I,
        )
        for p in parts:
            # Stop at metro station (starts with "м.")
            if re.match(r"^м\.\s*\w", p, re.I):
                break
            if STOP.match(p):
                break
            # Stop at city name that looks like a Russian city
            if re.match(r"^[А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+)*$", p) and len(p.split()) <= 2:
                # Could be city — if we already have street+house, stop
                if len(addr_parts) >= 2:
                    break
            addr_parts.append(p)
        if addr_parts:
            address = ", ".join(addr_parts)

    # District: look for named district / okrug / city
    for pat in [
        r"\b(ЗАО|ЦАО|ЮАО|ЮЗАО|СЗАО|СВАО|ЮВАО|ВАО|САО|ЗелАО)\b",
        r"(?:р-н|район)[е\s]+([А-Яа-яЁё\w\s\-]+?)(?=[,\n]|$)",
        r"мкр\.?\s+([А-Яа-яЁё\w\s\-]+?)(?=[,\n]|$)",
    ]:
        m = re.search(pat, title + " " + page_text[:2000], re.I)
        if m:
            d = m.group(1 if m.lastindex == 1 else 1).strip()
            if d and len(d) < 50:
                district = d
                break

    # If city subdomain, use city name as district fallback
    if district == "Не указан":
        city_match = re.search(
            r"(?:Королёв|Королев|Щёлково|Щелково|Мытищи|Балашиха|Химки|Подольск|Люберцы)",
            title + " " + page_text[:500], re.I
        )
        if city_match:
            district = city_match.group(0)

    return address, district


def parse_description(text: str) -> str:
    """
    Extract the full property description from page text.
    Skips nav/map blocks, returns everything else as-is.
    """
    SKIP_RE = re.compile(
        r"Яндекс|Yandex|Условия использования|Создать свою карту|"
        r"Продажа\s+\d|Аренда\s+\d|Купить\s+квартир|\d+\s*объявлени|"
        r"©|Циан|cian\.ru|база ЦИАН",
        re.I,
    )
    KW = [
        "квартир", "комнат", "площад", "этаж", "ремонт", "вид", "метро",
        "комплекс", "инфраструктур", "башн", "корпус", "застройщик",
        "балкон", "окна", "панорам", "набережн", "отделк", "санузел",
        "кухня", "гостин", "спальн", "преимущ",
    ]
    blocks = re.split(r"\n{2,}", text)
    best, best_score = "", 0
    for blk in blocks:
        blk = blk.strip()
        if len(blk) < 80 or SKIP_RE.search(blk):
            continue
        score = sum(1 for kw in KW if kw in blk.lower())
        if score > best_score or (score == best_score and len(blk) > len(best)):
            best, best_score = blk, score
    # No length limit — take the full description
    return best


def extract_advantages_from_text(text: str) -> list[str]:
    """
    Extract bullet-point advantages from description text.
    Cian sellers often list features as:  — Дизайнерский ремонт
    """
    advantages = []
    seen = set()
    for line in text.splitlines():
        line = line.strip()
        # Lines starting with — (em-dash), •, or ✓
        if re.match(r"^[—•✓\-]\s+\S", line):
            adv = re.sub(r"^[—•✓\-]+\s*", "", line).strip()
            # Must be a reasonable length, not a heading
            if 5 < len(adv) <= 120 and adv.lower() not in seen:
                seen.add(adv.lower())
                advantages.append(adv)
    return advantages[:12]



def filter_photos(urls: list[str], max_count: int = MAX_PHOTOS) -> list[str]:
    """
    Keep only real property photos from cdn-cian.ru/images/.
    - Strips query strings
    - Deduplicates: normalises -N.jpg → -1.jpg (original resolution)
    - Stops at max_count (first N = listing photos; later ones = similar listings)
    """
    seen_ids: set[str] = set()
    result: list[str] = []
    for raw_url in urls:
        # Strip query string and fragment
        url = raw_url.split("?")[0].split("#")[0].rstrip("/")

        if not url.startswith("https://images.cdn-cian.ru/images/"):
            continue
        low = url.lower()
        if any(kw in low for kw in SKIP_IMAGE_KEYWORDS):
            continue

        # Normalise to -1.jpg (original size)
        url = re.sub(r"-\d+\.(jpg|jpeg|png|webp)$", r"-1.\1", url, flags=re.I)

        # Extract numeric photo ID
        m = re.search(r"/(\d{6,})-1\.", url)
        if not m:
            continue
        pid = m.group(1)
        if pid in seen_ids:
            continue
        seen_ids.add(pid)
        result.append(url)
        if len(result) >= max_count:
            break

    return result



# ══════════════════════════════════════════════════════════════════════════════
#  BROWSER SCRAPING
# ══════════════════════════════════════════════════════════════════════════════

async def open_page(playwright, url: str):
    """Launch browser, navigate to URL, wait for page, return (browser, page_title, page_text, page_html, photos)."""
    browser = None
    for channel in ["msedge", "chrome", None]:
        try:
            kwargs = {
                "headless": False,
                "args": ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
            }
            if channel:
                kwargs["channel"] = channel
            browser = await playwright.chromium.launch(**kwargs)
            out(f"Браузер: {channel or 'chromium'}", "green")
            break
        except Exception:
            pass

    if not browser:
        raise RuntimeError("Не удалось запустить браузер. Установи Edge или Chrome.")

    ctx = await browser.new_context(
        viewport={"width": 1440, "height": 900},
        locale="ru-RU",
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    )
    await ctx.add_init_script(
        "Object.defineProperty(navigator,'webdriver',{get:()=>undefined});"
    )
    page = await ctx.new_page()

    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=45000)
    except Exception as e:
        out(f"  Timeout при загрузке (продолжаем): {e}", "yellow")

    # ── Ждём нормальной страницы ─────────────────────────────────────────────
    out("  Ждём загрузки страницы...", "cyan")
    try:
        await page.wait_for_load_state("networkidle", timeout=25000)
    except Exception:
        pass

    # Обработка капчи
    for _ in range(3):
        title = await page.title()
        body  = await page.evaluate("() => document.body?.innerText?.slice(0,400) || ''")
        if any(x in (title + body).lower() for x in ["captcha", "капча", "подтвердите", "robot"]):
            out("\n⚠️  КАПЧА! Реши её в браузере, нажми Enter здесь...", "yellow")
            input()
            try:
                await page.wait_for_load_state("networkidle", timeout=20000)
            except Exception:
                pass
        else:
            break

    # Ждём ключевой элемент
    for sel in ["h1", "[data-name='OfferTitle']", "[class*='price']"]:
        try:
            await page.wait_for_selector(sel, timeout=6000)
            break
        except Exception:
            pass

    # Скроллим чтобы все фото загрузились
    out("  Скроллим страницу для загрузки фото...", "cyan")
    for y in range(0, 10000, 400):
        await page.evaluate(f"window.scrollTo(0, {y})")
        await page.wait_for_timeout(200)
    await page.evaluate("window.scrollTo(0, 0)")
    await page.wait_for_timeout(1500)

    page_title = await page.title()
    out(f"  Заголовок: {page_title[:100]}", "dim")

    page_text = await page.evaluate("() => document.body?.innerText || ''")
    page_html = await page.evaluate("() => document.documentElement?.outerHTML || ''")

    # Фото из img-элементов
    img_urls: list[str] = await page.evaluate("""
        () => Array.from(document.querySelectorAll('img[src]'))
            .map(i => i.src)
            .filter(s => s.includes('cdn-cian.ru/images/') && /\\d{5,}/.test(s))
    """)

    await browser.close()
    return page_title, page_text, page_html, img_urls


def extract_all_photos(page_html: str, img_urls: list[str]) -> list[str]:
    """Collect photo URLs from HTML source + img elements, deduplicate."""
    # From HTML source
    html_photos = re.findall(
        r"https://images\.cdn-cian\.ru/images/\d[\w/\-]*\.(?:jpg|jpeg|png|webp)",
        page_html, re.I,
    )
    all_raw = html_photos + img_urls
    return filter_photos(all_raw)


def try_next_data(page_html: str) -> dict:
    """Try to get structured data from __NEXT_DATA__ script tag."""
    m = re.search(r'<script[^>]+id="__NEXT_DATA__"[^>]*>(.*?)</script>', page_html, re.S)
    if not m:
        return {}
    try:
        nd = json.loads(m.group(1))
        return _find_offer(nd) or {}
    except Exception:
        return {}


def _find_offer(node, _depth=0) -> dict | None:
    """Recursively find the offer object inside any JSON structure."""
    if _depth > 10:
        return None
    if isinstance(node, dict):
        if ("totalArea" in node or "area" in node) and ("bargainTerms" in node or "price" in node):
            return node
        for path in [
            ["props", "pageProps", "offerData", "offer"],
            ["props", "pageProps", "offer"],
            ["offerData", "offer"],
        ]:
            cur: dict | None = node
            for k in path:
                cur = cur.get(k) if isinstance(cur, dict) else None  # type: ignore
            if isinstance(cur, dict) and ("totalArea" in cur or "area" in cur):
                return cur
        for v in list(node.values())[:30]:
            r = _find_offer(v, _depth + 1)
            if r:
                return r
    elif isinstance(node, list):
        for item in node[:20]:
            r = _find_offer(item, _depth + 1)
            if r:
                return r
    return None


def build_property(page_title: str, page_text: str, next_data: dict, photo_urls: list[str]) -> dict:
    """Combine all sources into a single property dict."""
    prop: dict = {}

    if next_data and next_data.get("totalArea"):
        # ── __NEXT_DATA__ path (most reliable) ──────────────────────────────
        out("  Источник данных: __NEXT_DATA__", "green")
        bt  = next_data.get("bargainTerms") or {}
        geo = next_data.get("geo") or {}
        b   = next_data.get("building") or {}

        prop["price"]        = float(bt.get("price") or bt.get("priceRur") or 0)
        prop["area"]         = float(next_data.get("totalArea") or 0)
        prop["rooms"]        = next_data.get("roomsCount") or next_data.get("rooms")
        prop["floor"]        = next_data.get("floorNumber") or next_data.get("floor")
        prop["total_floors"] = b.get("floorsCount") or next_data.get("totalFloors")
        prop["description"]  = next_data.get("description") or ""
        prop["latitude"]     = (geo.get("coordinates") or {}).get("lat")
        prop["longitude"]    = (geo.get("coordinates") or {}).get("lng")

        # Address from geo.address array
        addr_parts = geo.get("address") or []
        if isinstance(addr_parts, list):
            wanted = {"Street", "House", "Highway", "Block"}
            parts  = [p.get("shortName") or p.get("name", "") for p in addr_parts if p.get("geoType") in wanted]
            prop["address"]  = ", ".join(p for p in parts if p) or page_title
            prop["district"] = next(
                (p.get("name") or p.get("shortName", "") for p in addr_parts
                 if p.get("geoType") in ("District", "district", "okrug")),
                "Не указан",
            )
        else:
            prop["address"], prop["district"] = parse_address(page_title, page_text)

        # ── Advantages: structured fields + description bullet points ──
        adv: list[str] = []

        # Metro stations
        undergrounds = geo.get("undergrounds") or []
        for u in undergrounds[:3]:
            mn = u.get("name", "")
            mt = u.get("travelTime")
            kind = "пешком" if u.get("travelType") == "walk" else "транспортом"
            if mn and mt:
                adv.append(f"Метро {mn} — {mt} мин. {kind}")

        # Building characteristics
        if b.get("buildYear"):
            adv.append(f"Год постройки: {b['buildYear']}")
        if b.get("ceilingHeight"):
            adv.append(f"Высота потолков: {b['ceilingHeight']} м")
        material = b.get("materialType") or b.get("buildingType", {})
        if isinstance(material, dict):
            material = material.get("name", "")
        MATERIALS = {
            "brick": "Кирпичный дом", "monolith": "Монолитный дом",
            "panel": "Панельный дом", "monolithBrick": "Монолит-кирпич",
            "block": "Блочный дом", "wood": "Деревянный дом",
        }
        if material and isinstance(material, str):
            adv.append(MATERIALS.get(material, f"Материал: {material}"))

        # Flat characteristics
        RENOVATION = {
            "cosmetic": "Косметический ремонт", "euro": "Евроремонт",
            "designer": "Дизайнерский ремонт", "no": "Без ремонта",
            "good": "Хороший ремонт", "prefinishing": "Предчистовая отделка",
        }
        ren = next_data.get("renovation") or next_data.get("repairType", {})
        if isinstance(ren, dict):
            ren = ren.get("name", "")
        if ren and isinstance(ren, str):
            adv.append(RENOVATION.get(ren.lower(), f"Ремонт: {ren}"))

        balconies = (next_data.get("balconiesCount") or 0) + (next_data.get("loggiasCount") or 0)
        if balconies:
            adv.append(f"{'Балкон' if balconies == 1 else f'Балконов/лоджий: {balconies}'}")

        VIEW = {
            "street": "Вид на улицу", "yard": "Вид во двор",
            "yardAndStreet": "Вид на улицу и двор", "park": "Вид на парк",
        }
        wv = next_data.get("windowsViewType")
        if wv and isinstance(wv, str):
            adv.append(VIEW.get(wv, f"Вид: {wv}"))

        # Bullet points from description text (seller-written features)
        desc_text = next_data.get("description") or ""
        if desc_text:
            text_adv = extract_advantages_from_text(desc_text)
            # Only add if no structural advantages found yet (avoids duplicates)
            if len(adv) < 3:
                adv.extend(text_adv)

        prop["advantages"] = adv

        # Photos from __NEXT_DATA__ (highest quality)
        nd_photos: list[str] = []
        for ph in (next_data.get("photos") or []):
            u = (ph.get("fullUrl") or ph.get("url") or "") if isinstance(ph, dict) else str(ph)
            if u.startswith("http"):
                nd_photos.append(u)
        prop["photo_urls"] = filter_photos(nd_photos) or photo_urls

    else:
        # ── Text extraction fallback ─────────────────────────────────────────
        out("  Источник данных: текст страницы", "yellow")
        prop["price"]       = parse_price(page_text)
        prop["area"]        = parse_area(page_text) or parse_area(page_title)
        prop["rooms"]       = parse_rooms(page_text) or parse_rooms(page_title)
        fl, tfl             = parse_floor(page_text)
        prop["floor"]       = fl
        prop["total_floors"]= tfl
        prop["address"], prop["district"] = parse_address(page_title, page_text)
        raw_desc = parse_description(page_text)
        prop["description"] = raw_desc
        prop["latitude"]    = None
        prop["longitude"]   = None
        prop["advantages"]  = extract_advantages_from_text(raw_desc)
        prop["photo_urls"]  = photo_urls

    prop["property_type"] = "apartment"  # Cian flat URLs → apartment

    # Build title
    r, a, addr = prop.get("rooms"), prop.get("area", 0), prop.get("address", "")
    fl, tfl    = prop.get("floor"), prop.get("total_floors")
    prop["title"] = f"{r}-комн. кв. {a} м², {addr}" if r else f"Квартира {a} м², {addr}"
    if fl and tfl:
        prop["title"] += f", {fl}/{tfl} эт."

    return prop


# ══════════════════════════════════════════════════════════════════════════════
#  INTERACTIVE REVIEW
# ══════════════════════════════════════════════════════════════════════════════

def review_and_edit(prop: dict) -> dict:
    """Show extracted data to user, allow editing key fields."""
    out("\n" + "─" * 60, "bold")
    out("  ИЗВЛЕЧЁННЫЕ ДАННЫЕ — проверь и исправь если нужно", "bold")
    out("─" * 60, "bold")

    fields = [
        ("title",        "Заголовок"),
        ("price",        "Цена (₽)"),
        ("area",         "Площадь (м²)"),
        ("rooms",        "Комнат"),
        ("floor",        "Этаж"),
        ("total_floors", "Этажей всего"),
        ("address",      "Адрес"),
        ("district",     "Район"),
    ]

    for key, label in fields:
        val = prop.get(key, "—")
        if key == "price" and val:
            display = f"{int(float(val)):,} ₽"
        else:
            display = str(val) if val else "—"
        out(f"  {label:<18} {display}", "cyan")

    out(f"\n  Фото:       {len(prop.get('photo_urls', []))} шт.", "cyan")
    out(f"  Описание:   {str(prop.get('description',''))[:80]}...", "dim")
    out("─" * 60, "bold")

    out("\nИзменить что-то? Введи номер поля или Enter чтобы сохранить:", "yellow")
    for i, (_, label) in enumerate(fields, 1):
        out(f"  {i}. {label}", "dim")
    out("  0. Сохранить как есть", "dim")
    out("  q. Отмена", "dim")

    while True:
        try:
            choice = input("\n> ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            out("\nОтмена.", "yellow")
            sys.exit(0)

        if choice in ("", "0"):
            break
        if choice == "q":
            out("Отмена.", "yellow")
            sys.exit(0)

        try:
            idx = int(choice) - 1
            if 0 <= idx < len(fields):
                key, label = fields[idx]
                try:
                    new_val = input(f"  Новое значение для «{label}»: ").strip()
                except (EOFError, KeyboardInterrupt):
                    continue
                if new_val:
                    if key == "price":
                        # Accept "58 000 000" or "58000000" or "58млн"
                        new_val = re.sub(r"\s+", "", new_val)
                        m = re.match(r"(\d+\.?\d*)\s*млн?", new_val, re.I)
                        prop[key] = float(m.group(1)) * 1_000_000 if m else float(new_val)
                    elif key in ("area",):
                        prop[key] = float(new_val.replace(",", "."))
                    elif key in ("rooms", "floor", "total_floors"):
                        prop[key] = int(new_val) if new_val.isdigit() else None
                    else:
                        prop[key] = new_val
                    out(f"  ✓ {label} → {prop[key]}", "green")
                    # Rebuild title if address/area/rooms/floor changed
                    if key in ("rooms", "area", "address", "floor", "total_floors"):
                        r, a, addr = prop.get("rooms"), prop.get("area", 0), prop.get("address", "")
                        fl, tfl    = prop.get("floor"), prop.get("total_floors")
                        prop["title"] = f"{r}-комн. кв. {a} м², {addr}" if r else f"Квартира {a} м², {addr}"
                        if fl and tfl:
                            prop["title"] += f", {fl}/{tfl} эт."
                        out(f"  ✓ Заголовок → {prop['title']}", "green")
        except (ValueError, IndexError):
            out("  Неверный ввод", "yellow")

    return prop


# ══════════════════════════════════════════════════════════════════════════════
#  DOWNLOAD & SAVE
# ══════════════════════════════════════════════════════════════════════════════

async def download_photos(urls: list[str]) -> list[str]:
    """Download photos, return list of local paths."""
    import httpx
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    saved: list[str] = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120",
        "Referer": "https://www.cian.ru/",
    }
    async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=30) as client:
        for i, url in enumerate(urls, 1):
            try:
                ext   = Path(urlparse(url).path).suffix or ".jpg"
                fname = hashlib.md5(url.encode()).hexdigest()[:16] + ext
                fpath = UPLOAD_DIR / fname
                if fpath.exists():
                    out(f"  [{i}/{len(urls)}] уже есть — пропускаем", "dim")
                else:
                    r = await client.get(url)
                    r.raise_for_status()
                    fpath.write_bytes(r.content)
                    out(f"  [{i}/{len(urls)}] {fpath.name}", "dim")
                saved.append(f"static/uploads/properties/{fname}")
            except Exception as e:
                out(f"  [{i}/{len(urls)}] ошибка: {e}", "yellow")
    return saved


def save_to_db(prop: dict, image_paths: list[str]) -> int:
    """Insert property and images into the database."""
    sys.path.insert(0, str(Path(__file__).parent))
    os.chdir(Path(__file__).parent)

    from app.db.session import SessionLocal
    from app.models.property import Property, PropertyImage, PropertyType, PropertyStatus
    from slugify import slugify

    db = SessionLocal()
    try:
        base = slugify(prop["title"][:80], allow_unicode=False) or "property"
        slug, n = base, 1
        while db.query(Property).filter(Property.slug == slug).first():
            slug = f"{base}-{n}"
            n += 1

        p = Property(
            title         = prop["title"],
            slug          = slug,
            property_type = PropertyType(prop.get("property_type", "apartment")),
            status        = PropertyStatus.sale,
            price         = prop.get("price", 0),
            area          = prop.get("area", 0),
            rooms         = prop.get("rooms"),
            floor         = prop.get("floor"),
            total_floors  = prop.get("total_floors"),
            address       = prop.get("address", ""),
            district      = prop.get("district", ""),
            latitude      = prop.get("latitude"),
            longitude     = prop.get("longitude"),
            description   = prop.get("description", ""),
            advantages    = prop.get("advantages", []),
            cian_url      = prop.get("cian_url"),
            is_featured   = 1,
        )
        db.add(p)
        db.flush()
        for i, path in enumerate(image_paths):
            db.add(PropertyImage(property_id=p.id, image_path=path, sort_order=i))
        db.commit()
        return p.id
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════════════════════

async def main() -> None:
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        out("Playwright не установлен: pip install playwright httpx && playwright install chromium", "red")
        sys.exit(1)

    if len(sys.argv) < 2:
        out("Использование: python parse_cian.py <URL>", "yellow")
        out("Пример:        python parse_cian.py https://www.cian.ru/sale/flat/123/", "dim")
        sys.exit(1)

    url = sys.argv[1].strip()
    if not url.startswith("http"):
        url = "https://" + url

    out(f"\n{'═' * 60}", "bold")
    out("  ЦИАН ПАРСЕР", "bold")
    out(f"  {url}", "cyan")
    out(f"{'═' * 60}\n", "bold")

    # ── 1. Открываем страницу ────────────────────────────────────────────────
    async with async_playwright() as pw:
        page_title, page_text, page_html, img_urls = await open_page(pw, url)
        og_price_raw = None

    # ── 2. Извлекаем данные ──────────────────────────────────────────────────
    out("\nИзвлекаю данные...", "cyan")
    next_data  = try_next_data(page_html)
    photo_urls = extract_all_photos(page_html, img_urls)
    out(f"  Фото найдено: {len(photo_urls)} уникальных", "cyan")

    # Use og:price if available (most reliable), else parse from text
    og_price = 0.0
    if og_price_raw:
        try:
            og_price = float(re.sub(r'[^\d.]', '', og_price_raw))
        except ValueError:
            pass

    prop = build_property(page_title, page_text, next_data, photo_urls)
    if og_price >= 500_000:
        prop['price'] = og_price
        out(f'  Цена из og:price: {og_price:,.0f}', 'green')
    prop["cian_url"] = url  # always save source URL

    # ── 3. Интерактивная проверка ────────────────────────────────────────────
    prop = review_and_edit(prop)

    # ── 4. Скачиваем фото ───────────────────────────────────────────────────
    photos_to_dl = prop.pop("photo_urls", [])
    out(f"\nСкачиваю {len(photos_to_dl)} фото...", "cyan")
    image_paths = await download_photos(photos_to_dl)
    out(f"  Сохранено: {len(image_paths)} файлов", "green")

    # ── 5. Сохраняем в БД ───────────────────────────────────────────────────
    out("\nСохраняю в БД...", "cyan")
    try:
        pid = save_to_db(prop, image_paths)
        out(f"\n✓ Готово! Объект сохранён с ID={pid}", "green")
        out("  Каталог: http://localhost:5173/catalog", "cyan")
    except Exception as e:
        out(f"\nОшибка БД: {e}", "red")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Ensure UTF-8 output on Windows
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
    asyncio.run(main())
