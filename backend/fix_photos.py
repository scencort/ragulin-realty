"""Patch parse_cian.py: fix photo dedup + limit to 15 + don't load similar listings."""
import re
src = open("parse_cian.py", encoding="utf-8").read()

# ── 1. Add MAX_PHOTOS constant after SKIP_IMAGE_KEYWORDS ────────────────────
src = src.replace(
    '}\n\n\n# ══════════════════════════════════════════════════════════════════════════════\n#  UTILS',
    '}\n\nMAX_PHOTOS = 15  # max photos to download per listing\n\n\n# ══════════════════════════════════════════════════════════════════════════════\n#  UTILS',
)

# ── 2. Replace filter_photos with fixed version ──────────────────────────────
old_start = src.index("\ndef filter_photos(")
old_end   = src.index("\n\n# ══════════════════════════════════════════════════════════════════════════════\n#  BROWSER SCRAPING")

new_fn = '''
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
        url = re.sub(r"-\\d+\\.(jpg|jpeg|png|webp)$", r"-1.\\1", url, flags=re.I)

        # Extract numeric photo ID
        m = re.search(r"/(\\d{6,})-1\\.", url)
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

'''

src = src[:old_start] + new_fn + src[old_end:]

# ── 3. Fix scroll: only scroll to ~2000px (main gallery), not 6000px ────────
src = src.replace(
    '    for y in range(0, 6000, 500):\n        await page.evaluate(f"window.scrollTo(0, {y})")\n        await page.wait_for_timeout(250)\n    await page.evaluate("window.scrollTo(0, 0)")\n    await page.wait_for_timeout(1000)',
    '    # Scroll only through the main gallery (not similar listings at bottom)\n    for y in range(0, 2500, 400):\n        await page.evaluate(f"window.scrollTo(0, {y})")\n        await page.wait_for_timeout(300)\n    await page.evaluate("window.scrollTo(0, 0)")\n    await page.wait_for_timeout(800)'
)

open("parse_cian.py", "w", encoding="utf-8").write(src)

import ast
try:
    ast.parse(src)
    print("Patch applied. Syntax OK.")
    # Quick check: count occurrences of key strings
    print(f"  filter_photos definition: {src.count('def filter_photos')}")
    print(f"  MAX_PHOTOS: {src.count('MAX_PHOTOS')}")
    print(f"  Scroll range 2500: {src.count('2500')}")
except SyntaxError as e:
    print(f"Syntax error: {e}")
