import re
src = open("scrape_cian.py", encoding="utf-8").read()

old_start = src.index("\ndef extract_description(")
old_end   = src.index("\nasync def download_images(")

new_fn = '''
def extract_description(text: str) -> str:
    import re as _re
    SKIP = [
        r"Яндекс|Yandex",
        r"Условия использования",
        r"Создать свою карту",
        r"Продажа\\s+\\d|Аренда\\s+\\d|Купить\\s+квартир",
        r"\\d+\\s*объявлени",
    ]
    KW = [
        "квартир", "комнат", "площад", "этаж", "ремонт", "вид", "метро",
        "комплекс", "инфраструктур", "башн", "корпус", "застройщик",
        "балкон", "окна", "панорам", "набережн", "отделк", "санузел",
    ]
    blocks = _re.split(r"\\n{2,}", text)
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

'''

src = src[:old_start] + new_fn + src[old_end:]
open("scrape_cian.py", "w", encoding="utf-8").write(src)

import ast
try:
    ast.parse(src)
    print("OK - syntax valid")
except SyntaxError as e:
    print(f"Syntax error: {e}")
