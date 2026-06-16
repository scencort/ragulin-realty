"""
POST /api/properties/parse-cian
Body: { "url": "https://www.cian.ru/sale/flat/..." }
Parses the listing, downloads photos, saves to DB, returns { "id": <property_id> }
"""
import asyncio
import concurrent.futures
import hashlib
import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin
from app.db.session import get_db
from app.models.property import Property, PropertyImage, PropertyType, PropertyStatus

router = APIRouter()

UPLOAD_DIR = Path("static/uploads/properties")
SKIP_IMAGE_KEYWORDS = {
    "icon", "logo", "promo", "banner", "header", "frontend",
    "avatar", "sprite", "placeholder", "favicon", "watermark",
    "newbuilding", "novostroyka", "kvartira-", "ulica-",
    "oferta", "offer-card", "plan", "layout", "scheme",
}
MAX_PHOTOS = 50


class CianParseRequest(BaseModel):
    url: str


# ── Photo helpers ────────────────────────────────────────────────────────────

def filter_photos(urls: list[str], max_count: int = MAX_PHOTOS) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for raw in urls:
        url = raw.split("?")[0].split("#")[0].rstrip("/")
        if not url.startswith("https://images.cdn-cian.ru/images/"):
            continue
        if any(kw in url.lower() for kw in SKIP_IMAGE_KEYWORDS):
            continue
        url = re.sub(r"-\d+\.(jpg|jpeg|png|webp)$", r"-1.\1", url, flags=re.I)
        m = re.search(r"/(\d{6,})-1\.", url)
        if not m:
            continue
        pid = m.group(1)
        if pid in seen:
            continue
        seen.add(pid)
        result.append(url)
        if len(result) >= max_count:
            break
    return result


async def download_photos(urls: list[str], property_dir: Path) -> list[str]:
    try:
        import httpx
    except ImportError:
        return []
    property_dir.mkdir(parents=True, exist_ok=True)
    saved: list[str] = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120",
        "Referer": "https://www.cian.ru/",
    }
    async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=30) as client:
        for url in urls:
            try:
                ext = Path(urlparse(url).path).suffix or ".jpg"
                fname = hashlib.md5(url.encode()).hexdigest()[:16] + ext
                fpath = property_dir / fname
                if not fpath.exists():
                    r = await client.get(url)
                    r.raise_for_status()
                    fpath.write_bytes(r.content)
                saved.append(str(fpath).replace("\\", "/"))
            except Exception:
                pass
    return saved


# ── Scraping ─────────────────────────────────────────────────────────────────

async def scrape(url: str) -> dict:
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        raise HTTPException(status_code=500, detail="Playwright не установлен")

    async with async_playwright() as pw:
        browser = None
        for channel in ["msedge", "chrome", None]:
            try:
                kw = {"headless": False, "args": ["--disable-blink-features=AutomationControlled"]}
                if channel:
                    kw["channel"] = channel
                browser = await pw.chromium.launch(**kw)
                break
            except Exception:
                pass
        if not browser:
            raise HTTPException(status_code=500, detail="Браузер не найден")

        ctx = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            locale="ru-RU",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        )
        await ctx.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>undefined});")
        page = await ctx.new_page()

        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=45000)
        except Exception:
            pass

        try:
            await page.wait_for_load_state("networkidle", timeout=20000)
        except Exception:
            pass

        # scroll to load all photos
        for y in range(0, 10000, 400):
            await page.evaluate(f"window.scrollTo(0, {y})")
            await page.wait_for_timeout(150)
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(1500)

        page_title = await page.title()
        page_text = await page.evaluate("() => document.body?.innerText || ''")
        page_html = await page.evaluate("() => document.documentElement?.outerHTML || ''")

        next_raw = await page.evaluate(
            "() => { const e=document.getElementById('__NEXT_DATA__'); return e?e.textContent:null; }"
        )
        og_price_raw = await page.evaluate("""
            () => {
                // Try og:price:amount first, then extract from meta description
                const direct = document.querySelector('meta[property="og:price:amount"], meta[name="price"]');
                if (direct) return direct.getAttribute('content');
                const desc = document.querySelector('meta[name="description"], meta[property="og:description"]');
                if (!desc) return null;
                const m = desc.getAttribute('content').match(/[Цц]ена[^\\d]*(\\d[\\d\\s\\u00a0]+\\d)\\s*руб/);
                return m ? m[1].replace(/[\\s\\u00a0]/g, '') : null;
            }
        """)
        img_urls: list[str] = await page.evaluate("""
            () => {
                // Only grab images inside OfferGallery — skip similar offers
                const gallery = document.querySelector('[data-name="OfferGallery"]');
                const container = gallery || document.body;
                return Array.from(container.querySelectorAll('img[src]'))
                    .map(i => i.src)
                    .filter(s => s.includes('cdn-cian.ru/images/') && /\\d{5,}/.test(s));
            }
        """)
        # Get real photo count shown on page ("Фотографии (40)" tab or "40 фото")
        photo_count_raw = await page.evaluate("""
            () => {
                const text = document.body.innerText;
                const m1 = text.match(/\\u0424\\u043e\\u0442\\u043e\\u0433\\u0440\\u0430\\u0444\\u0438\\u0438\\s*\\((\\d+)\\)/);
                if (m1) return parseInt(m1[1], 10);
                const m2 = text.match(/(\\d+)\\s*\\u0444\\u043e\\u0442\\u043e/i);
                if (m2) return parseInt(m2[1], 10);
                return 0;
            }
        """)
        # Click "Узнать больше" to expand description
        try:
            btn = await page.query_selector("button:has-text('Узнать больше'), [data-name*='ShowMore'], button:has-text('Показать')")
            if btn:
                await btn.click()
                await page.wait_for_timeout(800)
        except Exception:
            pass

        dom_description = await page.evaluate("""
            () => {
                const sels = [
                    '[data-name*="Description"]',
                    '[data-name*="description"]',
                    '[class*="description"]',
                    '[itemprop="description"]',
                ];
                for (const sel of sels) {
                    const el = document.querySelector(sel);
                    if (el && el.innerText && el.innerText.trim().length > 80) {
                        let text = el.innerText.trim();
                        // Remove "Узнать больше" button text and similar UI artifacts
                        text = text.replace(/\\s*Узнать больше\\s*/gi, '').trim();
                        text = text.replace(/\\s*Показать (всё|больше|ещё)\\s*/gi, '').trim();
                        text = text.replace(/\\s*Скрыть\\s*/gi, '').trim();
                        return text;
                    }
                }
                return null;
            }
        """)

        await browser.close()

    # parse __NEXT_DATA__ first — it has clean data and only real photos
    prop: dict = {}
    offer_photos: list[str] = []
    if next_raw:
        try:
            nd = json.loads(next_raw)
            offer = _find_offer(nd)
            if offer and offer.get("totalArea"):
                prop = _parse_offer(offer)
                offer_photos = prop.pop("photo_urls", [])
        except Exception:
            pass

    if not prop.get("area"):
        prop["price"] = _parse_price(page_text)
        prop["area"] = _parse_area(page_text) or _parse_area(page_title)
        prop["rooms"] = _parse_rooms(page_text) or _parse_rooms(page_title)
        fl, tfl = _parse_floor(page_text)
        prop["floor"], prop["total_floors"] = fl, tfl
        prop["address"], prop["district"] = _parse_address(page_title, page_text)
        prop["advantages"] = []
        prop["latitude"] = prop["longitude"] = None

    # Description: DOM selector is most reliable, fall back to text parsing
    if not prop.get("description"):
        prop["description"] = dom_description or _parse_description(page_text)

    # og:price overrides everything — it's always accurate
    if og_price_raw:
        try:
            og_price = float(re.sub(r"[^\d.]", "", og_price_raw))
            if og_price >= 100_000:
                prop["price"] = og_price
        except ValueError:
            pass

    # Use NEXT_DATA photos if available (clean, no floor plans).
    # Fall back to HTML extraction only if NEXT_DATA had no photos.
    # Use photo_count_raw to limit photos to just real gallery photos (no floor plans).
    real_photo_limit = int(photo_count_raw) if isinstance(photo_count_raw, (int, float)) and int(photo_count_raw) > 0 else MAX_PHOTOS
    if offer_photos:
        photo_urls = filter_photos(offer_photos, max_count=real_photo_limit)
    else:
        html_photos = re.findall(
            r"https://images\.cdn-cian\.ru/images/\d[\w/\-]*\.(?:jpg|jpeg|png|webp)",
            page_html, re.I,
        )
        photo_urls = filter_photos(html_photos + img_urls, max_count=real_photo_limit)

    prop["photo_urls"] = photo_urls
    prop["cian_url"] = url

    # Detect property type from URL
    if "/suburban/" in url or "/cottage/" in url:
        prop["property_type"] = "house"
    elif "/commercial/" in url:
        prop["property_type"] = "commercial"
    elif "/newobject/" in url or "/newflat/" in url:
        prop["property_type"] = "apartment"
    else:
        prop["property_type"] = prop.get("property_type") or "apartment"

    # Build title based on type
    a_raw = prop.get("area", 0)
    a = int(a_raw) if a_raw and float(a_raw) == int(float(a_raw)) else a_raw
    addr = prop.get("address", "")
    dist = prop.get("district", "")
    r = prop.get("rooms")
    ptype = prop["property_type"]

    if ptype == "house":
        prop["rooms"] = None  # no rooms for houses
        tfl = prop.get("total_floors")
        loc = dist if dist and dist != "Москва" else addr
        prop["title"] = f"Дом {a} м²" + (f", {loc}" if loc else "") + (f", {tfl} эт." if tfl else "")
    elif ptype == "commercial":
        prop["title"] = f"Коммерческая {a} м², {addr}" if a else f"Коммерческая, {addr}"
    elif r:
        fl, tfl = prop.get("floor"), prop.get("total_floors")
        prop["title"] = f"{r}-комн. кв. {a} м², {addr}"
        if fl and tfl:
            prop["title"] += f", {fl}/{tfl} эт."
    else:
        prop["title"] = f"Квартира {a} м², {addr}"

    return prop


def _find_offer(node, depth=0):
    if depth > 10:
        return None
    if isinstance(node, dict):
        if ("totalArea" in node or "area" in node) and ("bargainTerms" in node or "price" in node):
            return node
        for path in [["props","pageProps","offerData","offer"],["props","pageProps","offer"],["offerData","offer"]]:
            cur = node
            for k in path:
                cur = cur.get(k) if isinstance(cur, dict) else None
            if isinstance(cur, dict) and ("totalArea" in cur or "area" in cur):
                return cur
        for v in list(node.values())[:30]:
            r = _find_offer(v, depth + 1)
            if r:
                return r
    elif isinstance(node, list):
        for item in node[:20]:
            r = _find_offer(item, depth + 1)
            if r:
                return r
    return None


def _parse_offer(offer: dict) -> dict:
    bt = offer.get("bargainTerms") or {}
    geo = offer.get("geo") or {}
    b = offer.get("building") or {}
    addr_parts = geo.get("address") or []
    if isinstance(addr_parts, list):
        wanted = {"Street", "House", "Highway", "Block"}
        parts = [p.get("shortName") or p.get("name", "") for p in addr_parts if p.get("geoType") in wanted]
        address = ", ".join(p for p in parts if p) or "Москва"
        district = next((p.get("name") or p.get("shortName", "") for p in addr_parts
                         if p.get("geoType") in ("District", "district", "okrug")), "Москва")
    else:
        address, district = "Москва", "Москва"

    adv: list[str] = []
    for u in (geo.get("undergrounds") or [])[:3]:
        mn, mt = u.get("name", ""), u.get("travelTime")
        kind = "пешком" if u.get("travelType") == "walk" else "транспортом"
        if mn and mt:
            adv.append(f"Метро {mn} — {mt} мин. {kind}")
    if b.get("buildYear"):
        adv.append(f"Год постройки: {b['buildYear']}")
    if b.get("ceilingHeight"):
        adv.append(f"Высота потолков: {b['ceilingHeight']} м")

    photos: list[str] = []
    for ph in (offer.get("photos") or []):
        u = (ph.get("fullUrl") or ph.get("url") or "") if isinstance(ph, dict) else str(ph)
        u = re.sub(r"/\d{3,4}x\d{3,4}/", "/1600x1200/", u)
        if u.startswith("http"):
            photos.append(u)

    return {
        "price": float(bt.get("price") or bt.get("priceRur") or 0),
        "area": float(offer.get("totalArea") or offer.get("area") or 0),
        "rooms": offer.get("roomsCount") or offer.get("rooms"),
        "floor": offer.get("floorNumber") or offer.get("floor"),
        "total_floors": b.get("floorsCount") or offer.get("totalFloors"),
        "address": address,
        "district": district,
        "latitude": (geo.get("coordinates") or {}).get("lat"),
        "longitude": (geo.get("coordinates") or {}).get("lng"),
        "description": offer.get("description") or "",
        "advantages": adv,
        "photo_urls": photos,
    }


def _parse_price(text: str) -> float:
    import unicodedata
    t = "".join(" " if unicodedata.category(ch) in ("Zs","Cf") else ch for ch in text)
    RUBLE = chr(0x20BD)
    for m in re.finditer(r"(\d[\d ]{4,}\d)\s*(?:" + RUBLE + r"|руб)", t):
        ctx = t[max(0, m.start()-80):m.end()+80].lower()
        if re.search(r"за\s*м|за\s*кв|/\s*м", ctx):
            continue
        try:
            val = float(re.sub(r"\s+","",m.group(1)))
            if 500_000 <= val <= 2_000_000_000:
                return val
        except ValueError:
            pass
    for m in re.finditer(r"([\d]+[,.]?\d*)\s*млн", t, re.I):
        try:
            val = float(m.group(1).replace(",",".")) * 1_000_000
            if 500_000 <= val <= 2_000_000_000:
                return val
        except ValueError:
            pass
    return 0.0


def _parse_area(text: str) -> float:
    m = re.search(r"(\d+[,.]\d+|\d+)\s*м[²2]", text)
    return float(m.group(1).replace(",",".")) if m else 0.0


def _parse_rooms(text: str):
    m = re.search(r"(\d)\s*-?\s*(?:комн|комнат)", text, re.I)
    if m:
        return int(m.group(1))
    words = {"одно":1,"двух":2,"трёх":3,"трех":3,"четырёх":4}
    m = re.search(r"(одно|двух?|трёх|трех|четырёх)комнат", text, re.I)
    if m:
        return words.get(m.group(1).lower()[:5])
    return None


def _parse_floor(text: str):
    # "floor / total" or "floor из total"
    for pat in [r"(\d+)\s*/\s*(\d+)\s*(?:этаж|эт\.?)", r"(\d+)\s+из\s+(\d+)\s+(?:этаж|эт\.?)"]:
        m = re.search(pat, text, re.I)
        if m:
            f, t = int(m.group(1)), int(m.group(2))
            if 1 <= f <= t <= 200:
                return f, t
    # House: just total floors "3 этажа" / "3-этажный"
    m = re.search(r"(\d)\s*-?\s*этаж(?:а|ный|ей)?", text, re.I)
    if m:
        t = int(m.group(1))
        if 1 <= t <= 10:
            return None, t
    return None, None


def _parse_description(text: str) -> str:
    SKIP = re.compile(
        r"Яндекс|Yandex|Условия использования|Создать свою карту|"
        r"Продажа\s+\d|Аренда\s+\d|Купить\s+квартир|\d+\s*объявлени|"
        r"©|Циан|cian\.ru|база ЦИАН", re.I
    )
    KW = ["квартир","комнат","площад","этаж","ремонт","вид","метро","комплекс",
          "балкон","окна","панорам","набережн","отделк","санузел","кухня","спальн"]
    blocks = re.split(r"\n{2,}", text)
    best, best_score = "", 0
    for blk in blocks:
        blk = blk.strip()
        if len(blk) < 80 or SKIP.search(blk):
            continue
        score = sum(1 for kw in KW if kw in blk.lower())
        if score > best_score or (score == best_score and len(blk) > len(best)):
            best, best_score = blk, score
    return best[:3000]


def _parse_address(title: str, text: str):
    address, district = "Москва", "Москва"
    t = re.sub(r"^(?:Продажа|Продаю|Купить|Сдаю|Аренда)\s+.*?[\d,\.]+\s*м²\s*", "", title or "", flags=re.I).strip()
    t = re.sub(r"\s*[-–—]\s*база ЦИАН.*$", "", t).strip()
    # Remove leading "дом/квартиру/..." word leftovers
    t = re.sub(r"^(?:дом|квартиру|квартира|участок|таунхаус)\s+", "", t, flags=re.I).strip()
    parts = [p.strip() for p in t.split(",")]
    addr_parts: list[str] = []
    STOP = re.compile(r"^(Москва|Московская\s*обл|ЗАО|ЦАО|ЮАО|ЮЗАО|СЗАО|СВАО|ЮВАО|ВАО|САО|ЗелАО|НАО|ТАО|р-н|мкр\.?|№\s*\d)$", re.I)
    for p in parts:
        if STOP.match(p) or re.match(r"^м\.\s*\w", p, re.I):
            break
        addr_parts.append(p)
    if addr_parts:
        address = ", ".join(addr_parts)
    m = re.search(r"\b(ЗАО|ЦАО|ЮАО|ЮЗАО|СЗАО|СВАО|ЮВАО|ВАО|САО|ЗелАО|НАО|ТАО)\b", title + " " + text)
    if m:
        district = m.group(1)
    # For suburban — use named district from page text
    if district == "Москва":
        m2 = re.search(r"(?:Новомосковский|Троицкий|Щербинка|Ватутинки|Коммунарка|Переделкино|Рублёвка|Барвиха)", title + " " + text[:1000], re.I)
        if m2:
            district = m2.group(0)
    return address, district


def _run_scrape_in_thread(url: str) -> dict:
    """Run Playwright in a fresh thread with its own ProactorEventLoop (Windows fix)."""
    import sys
    if sys.platform == "win32":
        loop = asyncio.ProactorEventLoop()
    else:
        loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(scrape(url))
    finally:
        loop.close()


# ── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/parse-cian", dependencies=[Depends(get_current_admin)])
async def parse_cian(payload: CianParseRequest, db: Session = Depends(get_db)):
    url = payload.url.strip()
    if not url.startswith("http"):
        raise HTTPException(status_code=400, detail="Неверный URL")

    loop = asyncio.get_running_loop()
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        prop = await loop.run_in_executor(executor, _run_scrape_in_thread, url)

    if not prop.get("area"):
        raise HTTPException(status_code=422, detail="Не удалось извлечь данные. Попробуйте ещё раз или добавьте вручную.")

    # Download photos
    photo_urls = prop.pop("photo_urls", [])
    if photo_urls:
        tmp_dir = UPLOAD_DIR / "tmp"
        image_paths = await download_photos(photo_urls, tmp_dir)
    else:
        image_paths = []

    # Save property
    from slugify import slugify
    base = slugify(prop["title"][:80], allow_unicode=False) or "property"
    slug, n = base, 1
    while db.query(Property).filter(Property.slug == slug).first():
        slug = f"{base}-{n}"
        n += 1

    p = Property(
        title=prop["title"],
        slug=slug,
        property_type=PropertyType(prop.get("property_type", "apartment")),
        status=PropertyStatus.sale,
        price=prop.get("price", 0),
        area=prop.get("area", 0),
        rooms=prop.get("rooms"),
        floor=prop.get("floor"),
        total_floors=prop.get("total_floors"),
        address=prop.get("address", ""),
        district=prop.get("district", ""),
        latitude=prop.get("latitude"),
        longitude=prop.get("longitude"),
        description=prop.get("description", ""),
        advantages=prop.get("advantages", []),
        cian_url=prop.get("cian_url"),
        is_featured=1,
    )
    db.add(p)
    db.flush()

    # Move photos to proper dir and attach
    final_dir = UPLOAD_DIR / str(p.id)
    final_dir.mkdir(parents=True, exist_ok=True)
    for i, tmp_path in enumerate(image_paths):
        src = Path(tmp_path)
        if src.exists():
            dst = final_dir / src.name
            src.rename(dst)
            db.add(PropertyImage(property_id=p.id, image_path=str(dst).replace("\\", "/"), sort_order=i))

    db.commit()
    return {"id": p.id, "slug": p.slug, "title": p.title, "photos": len(image_paths)}
