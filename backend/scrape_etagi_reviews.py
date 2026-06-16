"""
Parser: Etagi realtor reviews -> Ragulin DB.
Usage: python scrape_etagi_reviews.py [REALTOR_URL]
"""
import asyncio, os, re, sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

DEFAULT_URL = "https://msk.etagi.com/realtors/89556/"


def log(msg, color=""):
    c = {"green": "\033[92m", "yellow": "\033[93m", "red": "\033[91m", "cyan": "\033[96m", "bold": "\033[1m"}
    print(f"{c.get(color,'')}{msg}\033[0m")


EXTRACT_JS = """
() => {
    const cards = Array.from(document.querySelectorAll('[data-testid="review_card"]'));
    return cards.map(c => {
        const name = c.querySelector('[data-testid="client_name"]')?.textContent?.trim() || '';
        const text = c.querySelector('[data-testid="review_content"]')?.textContent?.trim() || '';
        const date = c.querySelector('[data-testid="review_date"]')?.textContent?.trim() || '';
        const ratingText = Array.from(c.querySelectorAll('span')).find(s => /^\\d из 5$/.test(s.textContent.trim()));
        const rating = ratingText ? parseInt(ratingText.textContent.trim()[0], 10) : 5;
        return { name, text, date, rating };
    });
}
"""


async def smart_wait(page):
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


async def load_all_reviews(page, max_clicks=15):
    """Click 'Ещё N отзывов из M' repeatedly to load the full review list."""
    for i in range(max_clicks):
        btn = page.locator("button").filter(has_text=re.compile(r"Ещ[её].*отзыв", re.I)).first
        try:
            if await btn.count() == 0:
                break
            visible = await btn.is_visible()
            if not visible:
                break
            await btn.scroll_into_view_if_needed()
            await btn.click(timeout=5000)
            log(f"   Clicked load-more reviews button ({i+1})", "cyan")
            await page.wait_for_timeout(1000)
        except Exception:
            break


MONTHS = {
    "января": 1, "февраля": 2, "марта": 3, "апреля": 4, "мая": 5, "июня": 6,
    "июля": 7, "августа": 8, "сентября": 9, "октября": 10, "ноября": 11, "декабря": 12,
}


def parse_ru_date(s: str):
    m = re.search(r"(\d{1,2})\s+([а-яё]+)\s+(\d{4})", s, re.I)
    if not m:
        return None
    day, month_name, year = m.groups()
    month = MONTHS.get(month_name.lower())
    if not month:
        return None
    from datetime import datetime, timezone
    try:
        return datetime(int(year), month, int(day), tzinfo=timezone.utc)
    except ValueError:
        return None


async def main():
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        log("Install: pip install playwright", "red")
        sys.exit(1)

    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL
    log(f"\n{'='*60}", "bold")
    log("  ETAGI REVIEWS PARSER", "bold")
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

        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=40000)
        except Exception as e:
            log(f"Timeout (continuing): {e}", "yellow")

        await smart_wait(page)
        await load_all_reviews(page)

        reviews = await page.evaluate(EXTRACT_JS)
        await browser.close()

    log(f"\nExtracted {len(reviews)} reviews", "green")

    cleaned = []
    for r in reviews:
        text = (r.get("text") or "").strip()
        if not text:
            continue
        name = (r.get("name") or "").strip() or "Клиент Этажи"
        rating = r.get("rating") or 5
        date = parse_ru_date(r.get("date") or "")
        cleaned.append({"client_name": name, "text": text, "rating": rating, "date": date})

    log(f"Valid reviews with text: {len(cleaned)}", "cyan")
    for r in cleaned[:5]:
        log(f"  {r['client_name']} ({r['rating']}★, {r['date']}): {r['text'][:60]}...")

    log("\nSaving to DB...", "cyan")
    try:
        added = await insert_to_db(cleaned)
        log(f"\nDone! Added {added} new reviews (skipped duplicates).", "green")
        log("http://localhost:5173/reviews", "cyan")
    except Exception as e:
        log(f"DB error: {e}", "red")
        import traceback; traceback.print_exc()


async def insert_to_db(reviews: list) -> int:
    sys.path.insert(0, str(Path(__file__).parent))
    os.chdir(Path(__file__).parent)
    from app.db.session import SessionLocal
    from app.models.review import Review

    db = SessionLocal()
    added = 0
    try:
        existing_texts = {t for (t,) in db.query(Review.text).all()}
        for r in reviews:
            if r["text"] in existing_texts:
                continue
            review = Review(
                client_name=r["client_name"],
                text=r["text"],
                rating=r["rating"],
                is_published=True,
            )
            if r.get("date"):
                review.created_at = r["date"]
            db.add(review)
            existing_texts.add(r["text"])
            added += 1
        db.commit()
        return added
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
