"""
Patch parse_cian.py:
  1. parse_description → take full text, no 3000-char limit
  2. build_property → richer advantages from __NEXT_DATA__ + extract from description text
"""
import re
src = open("parse_cian.py", encoding="utf-8").read()

# ── 1. Replace parse_description ────────────────────────────────────────────
old_start = src.index("\ndef parse_description(")
old_end   = src.index("\ndef filter_photos(")

new_parse_desc = '''
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
    blocks = re.split(r"\\n{2,}", text)
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


'''

src = src[:old_start] + new_parse_desc + src[old_end:]

# ── 2. Replace the __NEXT_DATA__ advantages block ───────────────────────────
# Find and replace the advantages extraction inside build_property
OLD_ADV = """        # Metro
        undergrounds = geo.get("undergrounds") or []
        adv = []
        for u in undergrounds[:2]:
            mn = u.get("name", "")
            mt = u.get("travelTime")
            kind = "пешком" if u.get("travelType") == "walk" else "транспортом"
            if mn and mt:
                adv.append(f"Метро {mn} — {mt} мин. {kind}")
        if b.get("buildYear"):
            adv.append(f"Год постройки: {b['buildYear']}")
        if b.get("ceilingHeight"):
            adv.append(f"Высота потолков: {b['ceilingHeight']} м")
        prop["advantages"] = adv"""

NEW_ADV = """        # ── Advantages: structured fields + description bullet points ──
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

        prop["advantages"] = adv"""

src = src.replace(OLD_ADV, NEW_ADV)

# ── 3. Text-fallback: also extract advantages from description ───────────────
OLD_TEXT_ADV = """        prop[\"description\"] = parse_description(page_text)
        prop[\"latitude\"]    = None
        prop[\"longitude\"]   = None
        prop[\"advantages\"]  = []"""

NEW_TEXT_ADV = """        raw_desc = parse_description(page_text)
        prop[\"description\"] = raw_desc
        prop[\"latitude\"]    = None
        prop[\"longitude\"]   = None
        prop[\"advantages\"]  = extract_advantages_from_text(raw_desc)"""

src = src.replace(OLD_TEXT_ADV, NEW_TEXT_ADV)

open("parse_cian.py", "w", encoding="utf-8").write(src)

import ast
try:
    ast.parse(src)
    print("Patch applied. Syntax OK.")
    print(f"  parse_description: {src.count('def parse_description')}")
    print(f"  extract_advantages_from_text: {src.count('def extract_advantages_from_text')}")
    print(f"  RENOVATION dict: {src.count('RENOVATION')}")
except SyntaxError as e:
    print(f"Syntax error at line {e.lineno}: {e.msg}")
    # Show context
    lines = src.splitlines()
    start = max(0, e.lineno - 3)
    for i, ln in enumerate(lines[start:start+6], start+1):
        print(f"  {i:4}: {ln}")
