"""
Parser: Cian agent reviews -> Ragulin DB.
Usage: python scrape_cian_reviews.py [AGENT_URL]
"""
import asyncio, os, re, sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

DEFAULT_URL = "https://www.cian.ru/agents/84845411/"


def log(msg, color=""):
    c = {"green": "\033[92m", "yellow": "\033[93m", "red": "\033[91m", "cyan": "\033[96m", "bold": "\033[1m"}
    print(f"{c.get(color,'')}{msg}\033[0m")


EXTRACT_JS = """
() => {
    const articles = Array.from(document.querySelectorAll('article[data-name="Review"]'))
        .filter(a => !a.closest('[data-name="AnswersList"]'));
    return articles.map(a => {
        const nameEl = a.querySelector('[data-name="ReviewTitle"] span');
        const name = nameEl ? nameEl.textContent.trim() : '';
        const textEl = a.querySelector('p');
        const text = textEl ? textEl.textContent.trim() : '';
        const timeEl = a.querySelector('time');
        const date = timeEl ? timeEl.getAttribute('datetime') : null;
        const stars = Array.from(a.querySelectorAll('[data-name="ReviewInfo"] li'));
        let rating = 0;
        for (const li of stars) {
            const stops = li.querySelectorAll('stop');
            if (stops.length >= 3 && stops[2].getAttribute('offset') === '100%') rating++;
        }
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
    """Click 'Ещё N отзывов' repeatedly to load the full review list."""
    for i in range(max_clicks):
        btn = page.locator('[class*="show-more-reviews-button"]').first
        try:
            if await btn.count() == 0:
                break
            visible = await btn.is_visible()
            if not visible:
                break
            await btn.scroll_into_view_if_needed()
            await btn.click(timeout=5000)
            log(f"   Clicked load-more reviews button ({i+1})", "cyan")
            await page.wait_for_timeout(1200)
        except Exception:
            break


async def main():
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        log("Install: pip install playwright", "red")
        sys.exit(1)

    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL
    log(f"\n{'='*60}", "bold")
    log("  CIAN REVIEWS PARSER", "bold")
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
        name = (r.get("name") or "").strip()
        if not name or re.match(r"^ID:\d+$", name):
            name = "Клиент Циан"
        rating = r.get("rating") or 5
        cleaned.append({"client_name": name, "text": text, "rating": rating, "date": r.get("date")})

    log(f"Valid reviews with text: {len(cleaned)}", "cyan")
    for r in cleaned[:5]:
        log(f"  {r['client_name']} ({r['rating']}★): {r['text'][:60]}...")

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
    from datetime import datetime, timezone
    from app.db.session import SessionLocal
    from app.models.review import Review

    db = SessionLocal()
    added = 0
    try:
        existing_texts = {t for (t,) in db.query(Review.text).all()}
        for r in reviews:
            if r["text"] in existing_texts:
                continue
            created_at = None
            if r.get("date"):
                try:
                    created_at = datetime.fromisoformat(r["date"].replace("Z", "+00:00"))
                except Exception:
                    created_at = None
            review = Review(
                client_name=r["client_name"],
                text=r["text"],
                rating=r["rating"],
                is_published=True,
            )
            if created_at:
                review.created_at = created_at
            db.add(review)
            existing_texts.add(r["text"])
            added += 1
        db.commit()
        return added
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
