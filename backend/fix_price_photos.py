"""
Patch parse_cian.py:
  1. Extract og:price from page meta tags (authoritative Cian price source)
  2. Remove photo limit - take all photos from the listing
  3. Pass og_price into build_property
"""
import re
src = open("parse_cian.py", encoding="utf-8").read()

# ── 1. Remove MAX_PHOTOS limit (set to 50 to still filter truly garbage) ────
src = src.replace("MAX_PHOTOS = 15  # max photos to download per listing",
                  "MAX_PHOTOS = 50  # take up to 50 unique photos per listing")

# ── 2. In open_page: extract og:price meta tag ───────────────────────────────
OLD_IMG_EVAL = '''        # Фото из img-элементов
        img_urls: list[str] = await page.evaluate("""
            () => Array.from(document.querySelectorAll('img[src]'))
                .map(i => i.src)
                .filter(s => s.includes('cdn-cian.ru/images/') && /\\\\d{5,}/.test(s))
        """)

        await browser.close()
    return page_title, page_text, page_html, img_urls'''

NEW_IMG_EVAL = '''        # Фото из img-элементов
        img_urls: list[str] = await page.evaluate("""
            () => Array.from(document.querySelectorAll('img[src]'))
                .map(i => i.src)
                .filter(s => s.includes('cdn-cian.ru/images/') && /\\\\d{5,}/.test(s))
        """)

        # og:price:amount — authoritative listing price from meta tag
        og_price_raw = await page.evaluate("""
            () => {
                const m = document.querySelector('meta[property="og:price:amount"]') ||
                          document.querySelector('meta[name="price"]');
                return m ? m.getAttribute('content') : null;
            }
        """)

        await browser.close()
    return page_title, page_text, page_html, img_urls, og_price_raw'''

src = src.replace(OLD_IMG_EVAL, NEW_IMG_EVAL)

# ── 3. Update callers of open_page ───────────────────────────────────────────
src = src.replace(
    "    page_title, page_text, page_html, img_urls = await open_page(pw, url)",
    "    page_title, page_text, page_html, img_urls, og_price_raw = await open_page(pw, url)"
)

# ── 4. Pass og_price into build_property ────────────────────────────────────
src = src.replace(
    "    prop = build_property(page_title, page_text, next_data, photo_urls)\n    prop[\"cian_url\"] = url",
    "    # Use og:price if available (most reliable), else parse from text\n"
    "    og_price = 0.0\n"
    "    if og_price_raw:\n"
    "        try:\n"
    "            og_price = float(re.sub(r'[^\\d.]', '', og_price_raw))\n"
    "        except ValueError:\n"
    "            pass\n\n"
    "    prop = build_property(page_title, page_text, next_data, photo_urls)\n"
    "    if og_price >= 500_000:\n"
    "        prop['price'] = og_price\n"
    "        out(f'  Цена из og:price: {og_price:,.0f}', 'green')\n"
    "    prop[\"cian_url\"] = url"
)

open("parse_cian.py", "w", encoding="utf-8").write(src)

import ast
try:
    ast.parse(src)
    print("Patch applied. Syntax OK.")
    print(f"  MAX_PHOTOS: {src.count('MAX_PHOTOS = 50')}")
    print(f"  og_price_raw: {src.count('og_price_raw')}")
except SyntaxError as e:
    print(f"Syntax error line {e.lineno}: {e.msg}")
    lines = src.splitlines()
    for i, l in enumerate(lines[max(0,e.lineno-3):e.lineno+2], max(1,e.lineno-2)):
        print(f"  {i:4}: {l}")
