# patch_scraper.py — fixes three functions in scrape_cian.py
from pathlib import Path

lines = Path("scrape_cian.py").read_text(encoding="utf-8").splitlines(keepends=True)

# We'll replace complete functions by finding their start/end line numbers
def find_func_lines(lines, name):
    """Return (start, end) line indices for a top-level function."""
    start = None
    for i, l in enumerate(lines):
        if l.startswith(f"def {name}(") or l.startswith(f"async def {name}("):
            start = i
        elif start is not None and i > start:
            # End at next top-level def/class or end of file
            if (l.startswith("def ") or l.startswith("async def ") or l.startswith("class ")) and not l.startswith("    "):
                return start, i
    if start is not None:
        return start, len(lines)
    return None, None

# ── 1. Replace extract_price ─────────────────────────────────────────────────
s, e = find_func_lines(lines, "extract_price")
print(f"extract_price: lines {s}-{e}")
new_price = """\
def extract_price(text: str) -> float:
    \"\"\"Take the largest price before a ruble sign; ignore per-m2 values.\"\"\"
    import unicodedata
    # Normalise all space-like characters
    t = "".join(
        " " if unicodedata.category(ch) in ("Zs", "Cf") else ch
        for ch in text
    )
    candidates = []
    # Pattern: "47 890 000 \\u20bd" or "47890000 руб"
    import re
    for m in re.finditer(r"(\\d[\\d ]{4,}\\d)\\s*(?:\\u20bd|руб)", t):
        # Skip if preceded by "за м²" context (per-m2 price)
        ctx = t[max(0, m.start()-60):m.start()].lower()
        if re.search(r"\\bза\\s*м|\\bза\\s*кв|/\\s*м", ctx):
            continue
        try:
            val = float(re.sub(r"\\s+", "", m.group(1)))
            if 1_000_000 <= val <= 2_000_000_000:
                candidates.append(val)
        except ValueError:
            pass
    # Pattern: "47,8 млн"
    for m in re.finditer(r"([\\d]+[,.]?\\d*)\\s*млн", t, re.I):
        ctx = t[max(0, m.start()-60):m.start()].lower()
        if re.search(r"\\bза\\s*м|\\bза\\s*кв", ctx):
            continue
        try:
            val = float(m.group(1).replace(",", ".")) * 1_000_000
            if 1_000_000 <= val <= 2_000_000_000:
                candidates.append(val)
        except ValueError:
            pass
    return max(candidates) if candidates else 0.0


"""
lines[s:e] = new_price.splitlines(keepends=True)

# Recalculate after replacement
lines = Path("scrape_cian.py").read_text(encoding="utf-8").splitlines(keepends=True)

# Write new price function first
all_text = Path("scrape_cian.py").read_text(encoding="utf-8")
import re

# Replace extract_price
old_start = all_text.index("\ndef extract_price(")
old_end   = all_text.index("\ndef extract_area(")
all_text  = all_text[:old_start] + "\n" + new_price.rstrip("\n") + all_text[old_end:]

# ── 2. Replace extract_photos_from_html ──────────────────────────────────────
new_photos = """\
def extract_photos_from_html(html: str) -> list:
    \"\"\"Find real property photo URLs in HTML — only images.cdn-cian.ru/images/...\"\"\"
    # Match only property photo CDN URLs (have numeric ID in path)
    found = re.findall(
        r'https://images\\.cdn-cian\\.ru/images/\\d[\\w/\\-]*\\.(?:jpg|jpeg|png|webp)',
        html, re.I
    )
    SKIP = {"icon", "logo", "promo", "banner", "header", "frontend",
            "avatar", "sprite", "placeholder", "favicon", "watermark",
            "newbuilding", "novostroyka"}

    def upgrade(u):
        u = u.split("?")[0]
        # Replace size suffix like -1.jpg or -2.jpg with -1.jpg (keep -1 as largest)
        u = re.sub(r"-\\d+\\.jpg$", "-1.jpg", u)
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

"""

old_ph_start = all_text.index("\ndef extract_photos_from_html(")
old_ph_end   = all_text.index("\nasync def smart_wait(")
all_text     = all_text[:old_ph_start] + "\n" + new_photos.rstrip("\n") + all_text[old_ph_end:]

# ── 3. Replace extract_description ───────────────────────────────────────────
new_desc = """\
def extract_description(text: str) -> str:
    \"\"\"Find the actual listing description — longest block with property keywords.\"\"\"
    keywords = [
        "квартир", "комнат", "площад", "этаж", "ремонт", "вид", "метро",
        "комплекс", "инфраструктур", "башн", "корпус", "застройщик",
        "балкон", "окна", "панорам", "набережн",
    ]
    # Split text into blocks separated by blank lines or long runs of whitespace
    blocks = re.split(r"\\n{2,}", text)
    best, best_score = "", 0
    for blk in blocks:
        blk = blk.strip()
        if len(blk) < 150:
            continue
        # Skip navigation-like blocks
        if re.search(r"Продажа\\s+\\d|Аренда\\s+\\d|Купить\\s+квартир", blk):
            continue
        score = sum(1 for kw in keywords if kw.lower() in blk.lower())
        if score > best_score or (score == best_score and len(blk) > len(best)):
            best, best_score = blk, score
    return best[:3000] if best else ""

"""

old_desc_start = all_text.index("\ndef extract_description(")
old_desc_end   = all_text.index("\nasync def download_images(")
all_text       = all_text[:old_desc_start] + "\n" + new_desc.rstrip("\n") + all_text[old_desc_end:]

Path("scrape_cian.py").write_text(all_text, encoding="utf-8")
print("All 3 patches applied successfully.")

# Verify
import ast
try:
    ast.parse(all_text)
    print("Syntax OK.")
except SyntaxError as e:
    print(f"Syntax error: {e}")
