"""
Parser: Cian listing -> Ragulin DB.
Usage: python scrape_cian.py [URL]
"""
import asyncio, json, os, re, sys, hashlib
from pathlib import Path
from urllib.parse import urlparse

DEFAULT_URL = "https://www.cian.ru/sale/flat/328810696/"
UPLOAD_DIR  = Path("static/uploads/properties")


def log(msg, color=""):
    c = {"green":"\033[92m","yellow":"\033[93m","red":"\033[91m","cyan":"\033[96m","bold":"\033[1m"}
    print(f"{c.get(color,'')}{msg}\033[0m")


# ── Text-based extraction (works on any Cian page) ───────────────────────────

def extract_price(text: str) -> float:
    import unicodedata, re as _re
    t = ''.join(' ' if unicodedata.category(ch) in ('Zs','Cf') else ch for ch in text)
    candidates = []
    # Match e.g. '47 890 000 ruble_sign'
    for m in _re.finditer(r'(\d[\d ]{4,}\d)\s*(?:' + chr(0x20bd) + r'|руб)', t):
        window = t[max(0, m.start()-80):m.end()+80].lower()
        if _re.search(r'за\s*м|за\s*кв|/\s*м', window):
            continue
        try:
            val = float(_re.sub(r'\s+', '', m.group(1)))
            if 1_000_000 <= val <= 2_000_000_000:
                candidates.append(val)
        except ValueError:
            pass
    # Match '47,8 млн'
    for m in _re.finditer(r'([\d]+[,.]?\d*)\s*млн', t, _re.I):
        window = t[max(0, m.start()-60):m.end()+60].lower()
        if _re.search(r'за\s*м|за\s*кв', window):
            continue
        try:
            val = float(m.group(1).replace(',', '.')) * 1_000_000
            if 1_000_000 <= val <= 2_000_000_000:
                candidates.append(val)
        except ValueError:
            pass
    # Return the FIRST valid price (Cian shows the listing price first on the page)
    return candidates[0] if candidates else 0.0


def extract_area(text: str) -> float:
    m = re.search(r"([\d]+[,.][\d]+|[\d]+)\s*м[²2]", text)
    return float(m.group(1).replace(",", ".")) if m else 0.0

def extract_rooms(text: str) -> int | None:
    m = re.search(r"(\d)\s*-?\s*(?:комн|комнат)", text, re.I)
    if m:
        return int(m.group(1))
    m = re.search(r"(однокомнат|двухкомнат|трёхкомнат|трехкомнат|четырёхкомнат)", text, re.I)
    if m:
        w = m.group(1).lower()
        return {"одно": 1, "двух": 2, "трёх": 3, "трех": 3, "четырёх": 4}.get(w[:5], None)
    return None

def extract_floor(text: str) -> tuple:
    # "21 из 25 этаж" or "21/25 эт" or "21 этаж"
    m = re.search(r"(\d+)\s*/\s*(\d+)\s*(?:этаж|эт\.?)", text, re.I)
    if m:
        return int(m.group(1)), int(m.group(2))
    m = re.search(r"(\d+)\s+(?:из|из)\s+(\d+)\s+(?:этаж|эт)", text, re.I)
    if m:
        return int(m.group(1)), int(m.group(2))
    m = re.search(r"(?:этаж|этаже)[^\d]*(\d+)[^\d]*(?:из|/)[^\d]*(\d+)", text, re.I)
    if m:
        return int(m.group(1)), int(m.group(2))
    m = re.search(r"на\s+(\d+)\s+этаж", text, re.I)
    if m:
        return int(m.group(1)), None
    return None, None

def extract_address_district(page_title: str, page_text: str) -> tuple:
    """Get address and district from page title like:
    'Продажа двухкомнатной квартиры 48.8м² Кутузовский проезд, 16А/1, Москва, ЗАО, р-...'
    """
    address, district = "Москва", "Москва"

    # Page title contains full address
    if page_title:
        # Strip leading "Продажа ... квартиры NNм² "
        t = re.sub(r"^Продажа.*?[\d,\.]+м²\s*", "", page_title, flags=re.I).strip()
        # Remove trailing city/district info: ", Москва, ЗАО, ..."
        parts = [p.strip() for p in t.split(",")]
        # Filter out "Москва" and district codes and trailing trash
        addr_parts = []
        for p in parts:
            if re.match(r"^(Москва|ЗАО|ЦАО|ЮАО|ЮЗАО|СЗАО|СВАО|ЮВАО|ВАО|САО|ЗелАО|р-н|округ)$", p, re.I):
                break
            addr_parts.append(p)
        if addr_parts:
            address = ", ".join(addr_parts)

    # District from page title
    m = re.search(r"\b(ЗАО|ЦАО|ЮАО|ЮЗАО|СЗАО|СВАО|ЮВАО|ВАО|САО|ЗелАО)\b", page_title + " " + page_text)
    if m:
        district = m.group(1)

    # Try to find named district
    m = re.search(r"(?:район|р-н)[е\s]+([А-Яа-яЁё\s\-]+?)(?=[,\n\.])", page_text)
    if m:
        d = m.group(1).strip()
        if d and len(d) < 40:
            district = d if not district or district == "Москва" else f"{district}, {d}"

    return address, district

def extract_metro(text: str) -> list:
    metros = re.findall(
        r"(?:метро|м\.)\s+([А-Яа-яЁё\s\-]+?)\s*(?:[-–—]|\()?\s*(\d+)\s*мин",
        text, re.I
    )
    result = []
    for name, mins in metros[:3]:
        result.append(f"Метро {name.strip()} — {mins} мин.")
    return result

def extract_photos_from_html(html: str) -> list:
    """Find real property photo URLs in HTML — only images.cdn-cian.ru/images/..."""
    # Match only property photo CDN URLs (have numeric ID in path)
    found = re.findall(
        r'https://images\.cdn-cian\.ru/images/\d[\w/\-]*\.(?:jpg|jpeg|png|webp)',
        html, re.I
    )
    SKIP = {"icon", "logo", "promo", "banner", "header", "frontend",
            "avatar", "sprite", "placeholder", "favicon", "watermark",
            "newbuilding", "novostroyka"}

    def upgrade(u):
        u = u.split("?")[0]
        # Replace size suffix like -1.jpg or -2.jpg with -1.jpg (keep -1 as largest)
        u = re.sub(r"-\d+\.jpg$", "-1.jpg", u)
        return u

    seen, result = set(), []
    for u in found:
        low = u.lower()
        if any(s in low for s in SKIP):
            continue
        u = upgrade(u)
        if u not in seen:
            seen.add(u)
            result.append(u)
    return result
async def smart_wait(page) -> str:
    """Wait for page to load, handle captcha, return page title."""
    log("   Waiting for page...", "cyan")
    try:
        await page.wait_for_load_state("networkidle", timeout=25000)
    except Exception:
        pass

    for _ in range(5):
        title = await page.title()
        body_text = await page.evaluate("() => document.body?.innerText?.slice(0,500) || ''")
        if any(x in (title + body_text).lower() for x in ["captcha", "капча", "подтвердите", "robot"]):
            log("\n*** CAPTCHA! Solve it in the browser, then press Enter... ***", "yellow")
            input()
            try:
                await page.wait_for_load_state("networkidle", timeout=20000)
            except Exception:
                pass
        else:
            break

    # Wait for key element
    for sel in ["h1", "[data-name='OfferTitle']", "[class*='price']", "[class*='Price']"]:
        try:
            await page.wait_for_selector(sel, timeout=8000)
            break
        except Exception:
            pass

    # Scroll to trigger lazy load of photos
    log("   Scrolling to load photos...", "cyan")
    for y in range(0, 10000, 400):
        await page.evaluate(f"window.scrollTo(0, {y})")
        await page.wait_for_timeout(200)
    await page.evaluate("window.scrollTo(0, 0)")
    await page.wait_for_timeout(2000)

    title = await page.title()
    log(f"   Title: {title[:100]}", "cyan")
    return title


async def main():
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        log("Install: pip install playwright httpx", "red")
        sys.exit(1)

    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL
    log(f"\n{'='*60}", "bold")
    log("  CIAN PARSER", "bold")
    log(f"  {url}", "cyan")
    log(f"{'='*60}\n", "bold")

    async with async_playwright() as p:
        browser = None
        for ch in ["msedge", "chrome", None]:
            try:
                kw = {"headless": False, "args": ["--disable-blink-features=AutomationControlled"]}
                if ch:
                    kw["channel"] = ch
                browser = await p.chromium.launch(**kw)
                log(f"Browser: {ch or 'chromium'}", "green")
                break
            except Exception:
                pass
        if not browser:
            log("No browser available", "red"); sys.exit(1)

        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, locale="ru-RU")
        await ctx.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>undefined});")
        page = await ctx.new_page()

        # Intercept photo responses
        intercepted_photos: list = []
        def on_resp(resp):
            u = resp.url
            if re.search(r"\.cian\.ru.+\.(jpg|jpeg|png|webp)", u, re.I) and "thumbnail" not in u.lower():
                clean = re.sub(r"/\d{3,4}x\d{3,4}/", "/1600x1200/", u.split("?")[0])
                if clean not in intercepted_photos:
                    intercepted_photos.append(clean)
        page.on("response", on_resp)

        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=40000)
        except Exception as e:
            log(f"Timeout (continuing): {e}", "yellow")

        page_title = await smart_wait(page)

        # Get full page content
        page_text = await page.evaluate("() => document.body?.innerText || ''")
        page_html = await page.evaluate("() => document.documentElement?.outerHTML || ''")

        # Try __NEXT_DATA__ one more time (after full load)
        next_raw = await page.evaluate(
            "() => { const e=document.getElementById('__NEXT_DATA__'); return e?e.textContent:null; }"
        )

        # Collect photos from HTML source
        html_photos = extract_photos_from_html(page_html)

        # Also grab img elements directly
        img_srcs = await page.evaluate("""
            () => Array.from(document.querySelectorAll('img'))
                .map(i => i.src || i.getAttribute('data-src') || '')
                .filter(s => s.includes('cian') && s.length > 20)
        """)

        await browser.close()

    log(f"Network photos intercepted: {len(intercepted_photos)}", "cyan")
    log(f"HTML photos found:          {len(html_photos)}", "cyan")
    log(f"IMG elements:               {len(img_srcs)}", "cyan")

    # ── Try __NEXT_DATA__ first ──────────────────────────────────────────────
    offer_obj = None
    next_data_photos: list = []
    if next_raw:
        try:
            nd = json.loads(next_raw)
            offer_obj = _find_offer(nd)
            # Always try to grab all photos from __NEXT_DATA__ regardless of offer detection
            nd_str = next_raw
            for ph_url in re.findall(r'"(?:fullUrl|url)"\s*:\s*"(https://[^"]+cdn-cian[^"]+\.(?:jpg|jpeg|png|webp))"', nd_str, re.I):
                clean = re.sub(r"/\d{3,4}x\d{3,4}/", "/1600x1200/", ph_url.split("?")[0])
                if clean not in next_data_photos:
                    next_data_photos.append(clean)
            log(f"__NEXT_DATA__ photos: {len(next_data_photos)}", "cyan")
        except Exception:
            pass

    prop: dict = {}

    if offer_obj and offer_obj.get("totalArea"):
        log("Using __NEXT_DATA__", "green")
        prop = parse_next_data(offer_obj)
    else:
        log("Using text extraction", "yellow")
        prop["price"]        = extract_price(page_text)
        prop["area"]         = extract_area(page_text) or extract_area(page_title)
        prop["rooms"]        = extract_rooms(page_text) or extract_rooms(page_title)
        prop["floor"], prop["total_floors"] = extract_floor(page_text)
        prop["address"], prop["district"]   = extract_address_district(page_title, page_text)
        prop["description"]  = extract_description(page_text)
        prop["property_type"] = "apartment"
        prop["latitude"]     = None
        prop["longitude"]    = None
        prop["advantages"]   = extract_metro(page_text)

    # ── Title ────────────────────────────────────────────────────────────────
    r, a, addr = prop.get("rooms"), prop.get("area", 0), prop.get("address", "Москва")
    fl, tfl    = prop.get("floor"), prop.get("total_floors")
    prop["title"] = (f"{r}-комн. кв. {a} м², {addr}" if r else f"Квартира {a} м², {addr}")
    if fl and tfl:
        prop["title"] += f", {fl}/{tfl} эт."

    # ── Merge all photos ─────────────────────────────────────────────────────
    all_photos = list(dict.fromkeys(
        next_data_photos +
        prop.get("photo_urls", []) +
        intercepted_photos +
        html_photos +
        [s for s in img_srcs if s.startswith("http")]
    ))
    # Keep only proper photo URLs, prefer large sizes
    all_photos = [u for u in all_photos if re.search(r"\.(jpg|jpeg|png|webp)$", u, re.I)]

    log(f"\nExtracted:", "green")
    log(f"  Title:    {prop['title']}")
    log(f"  Price:    {prop.get('price', 0):,.0f} RUB")
    log(f"  Area:     {prop.get('area')} m2")
    log(f"  Rooms:    {prop.get('rooms')}")
    log(f"  Floor:    {prop.get('floor')}/{prop.get('total_floors')}")
    log(f"  Address:  {prop.get('address')}")
    log(f"  District: {prop.get('district')}")
    log(f"  Photos:   {len(all_photos)}")
    if prop.get("description"):
        log(f"  Desc:     {prop['description'][:120]}...")

    if not prop.get("area"):
        log("\nFailed to extract area. Raw data:", "red")
        print(json.dumps(prop, ensure_ascii=False, indent=2))
        sys.exit(1)

    # ── Download photos ──────────────────────────────────────────────────────
    if all_photos:
        log(f"\nDownloading {len(all_photos)} photos...", "cyan")
        image_paths = await download_images(all_photos)
        log(f"  Saved: {len(image_paths)}", "green")
    else:
        log("\nNo photos found.", "yellow")
        image_paths = []

    # ── Save to DB ───────────────────────────────────────────────────────────
    log("\nSaving to DB...", "cyan")
    try:
        pid = await insert_to_db(prop, image_paths)
        log(f"\nDone! ID={pid}", "green")
        log("http://localhost:5173/catalog", "cyan")
    except Exception as e:
        log(f"DB error: {e}", "red")
        import traceback; traceback.print_exc()


def _find_offer(node, depth=0):
    if depth > 10: return None
    if isinstance(node, dict):
        if ("totalArea" in node or "area" in node) and ("bargainTerms" in node or "price" in node):
            return node
        for path in [["props","pageProps","offerData","offer"], ["props","pageProps","offer"],
                     ["offerData","offer"], ["offer"], ["data","offer"]]:
            cur = node
            for k in path:
                cur = cur.get(k) if isinstance(cur, dict) else None
            if isinstance(cur, dict) and ("totalArea" in cur or "area" in cur):
                return cur
        for v in list(node.values())[:30]:
            r = _find_offer(v, depth+1)
            if r: return r
    elif isinstance(node, list):
        for i in node[:15]:
            r = _find_offer(i, depth+1)
            if r: return r
    return None


def parse_next_data(offer: dict) -> dict:
    bt = offer.get("bargainTerms") or {}
    geo = offer.get("geo") or {}
    addr_parts = geo.get("address") or []

    if isinstance(addr_parts, list):
        wanted = {"Street","House","Highway","Block","district"}
        parts  = [p.get("shortName") or p.get("name","") for p in addr_parts
                  if p.get("geoType") in wanted or not p.get("geoType")]
        address = ", ".join(p for p in parts if p) or "Москва"
        district = next((p.get("name") or p.get("shortName","") for p in addr_parts
                         if p.get("geoType") in ("District","district","okrug","Okrug")), "Москва")
    else:
        address, district = "Москва", "Москва"

    undergrounds = geo.get("undergrounds") or []
    adv = []
    for u in undergrounds[:2]:
        mn, mt = u.get("name",""), u.get("travelTime")
        kind = "пешком" if u.get("travelType")=="walk" else "транспортом"
        if mn and mt: adv.append(f"Метро {mn} — {mt} мин. {kind}")

    b = offer.get("building") or {}
    if b.get("buildYear"):    adv.append(f"Год постройки: {b['buildYear']}")
    if b.get("ceilingHeight"): adv.append(f"Высота потолков: {b['ceilingHeight']} м")

    photos = []
    for ph in (offer.get("photos") or []):
        u = (ph.get("fullUrl") or ph.get("url") or "") if isinstance(ph, dict) else str(ph)
        u = re.sub(r"/\d{3,4}x\d{3,4}/", "/1600x1200/", u)
        if u.startswith("http"): photos.append(u)

    return {
        "price":        float(bt.get("price") or bt.get("priceRur") or 0),
        "area":         float(offer.get("totalArea") or offer.get("area") or 0),
        "rooms":        offer.get("roomsCount") or offer.get("rooms"),
        "floor":        offer.get("floorNumber") or offer.get("floor"),
        "total_floors": b.get("floorsCount") or offer.get("totalFloors"),
        "address":      address,
        "district":     district,
        "latitude":     (geo.get("coordinates") or {}).get("lat"),
        "longitude":    (geo.get("coordinates") or {}).get("lng"),
        "description":  offer.get("description") or "",
        "property_type":"apartment",
        "advantages":   adv,
        "photo_urls":   photos,
    }


def extract_description(text: str) -> str:
    import re as _re
    SKIP = [
        r"Яндекс|Yandex",
        r"Условия использования",
        r"Создать свою карту",
        r"Продажа\s+\d|Аренда\s+\d|Купить\s+квартир",
        r"\d+\s*объявлени",
    ]
    KW = [
        "квартир", "комнат", "площад", "этаж", "ремонт", "вид", "метро",
        "комплекс", "инфраструктур", "башн", "корпус", "застройщик",
        "балкон", "окна", "панорам", "набережн", "отделк", "санузел",
    ]
    blocks = _re.split(r"\n{2,}", text)
    best, best_score = "", 0
    for blk in blocks:
        blk = blk.strip()
        if len(blk) < 200:
            continue
        if any(_re.search(pat, blk, _re.I) for pat in SKIP):
            continue
        score = sum(1 for kw in KW if kw.lower() in blk.lower())
        if score > best_score or (score == best_score and len(blk) > len(best)):
            best, best_score = blk, score
    if not best:
        # fallback: longest block without map/nav patterns
        for blk in sorted(blocks, key=len, reverse=True):
            blk = blk.strip()
            if len(blk) < 100:
                continue
            if not any(_re.search(pat, blk, _re.I) for pat in SKIP[:3]):
                best = blk
                break
    return best[:3000] if best else ""


async def download_images(urls: list) -> list:
    import httpx
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    saved = []
    headers = {"User-Agent": "Mozilla/5.0 Chrome/120.0.0.0", "Referer": "https://www.cian.ru/"}
    async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=30) as client:
        for i, url in enumerate(urls):
            try:
                ext   = Path(urlparse(url).path).suffix or ".jpg"
                fname = hashlib.md5(url.encode()).hexdigest()[:16] + ext
                fpath = UPLOAD_DIR / fname
                if fpath.exists():
                    pass
                else:
                    log(f"  [{i+1}/{len(urls)}] {url[-60:]}", "cyan")
                    r = await client.get(url)
                    r.raise_for_status()
                    fpath.write_bytes(r.content)
                saved.append(f"static/uploads/properties/{fname}")
            except Exception as e:
                log(f"  [!] {e}", "yellow")
    return saved


async def insert_to_db(prop: dict, images: list) -> int:
    sys.path.insert(0, str(Path(__file__).parent))
    os.chdir(Path(__file__).parent)
    from app.db.session import SessionLocal
    from app.models.property import Property, PropertyImage, PropertyType, PropertyStatus
    from slugify import slugify

    db = SessionLocal()
    try:
        base = slugify(prop["title"][:100], allow_unicode=False) or "property"
        slug, n = base, 1
        while db.query(Property).filter(Property.slug == slug).first():
            slug = f"{base}-{n}"; n += 1
        p = Property(
            title=prop["title"], slug=slug,
            property_type=PropertyType(prop.get("property_type","apartment")),
            status=PropertyStatus.sale,
            price=prop.get("price", 0), area=prop.get("area", 0),
            rooms=prop.get("rooms"), floor=prop.get("floor"),
            total_floors=prop.get("total_floors"),
            address=prop.get("address","Москва"), district=prop.get("district","Москва"),
            latitude=prop.get("latitude"), longitude=prop.get("longitude"),
            description=prop.get("description",""), advantages=prop.get("advantages",[]),
            is_featured=1,
        )
        db.add(p); db.flush()
        for i, path in enumerate(images):
            db.add(PropertyImage(property_id=p.id, image_path=path, sort_order=i))
        db.commit()
        return p.id
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
