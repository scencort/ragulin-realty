"""
Parses reviews from both Cian and Etagi and saves them to the DB.
Run locally (not on a headless server) — both scrapers open a real
visible browser window to avoid anti-bot blocking.

Usage: python scrape_all_reviews.py
"""
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent

CIAN_URL = "https://www.cian.ru/agents/84845411/"
ETAGI_URL = "https://msk.etagi.com/realtors/89556/"


def run(label: str, script: str, url: str) -> bool:
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}\n")
    result = subprocess.run([sys.executable, str(HERE / script), url])
    return result.returncode == 0


def main():
    ok_cian = run("CIAN REVIEWS", "scrape_cian_reviews.py", CIAN_URL)
    ok_etagi = run("ETAGI REVIEWS", "scrape_etagi_reviews.py", ETAGI_URL)

    print(f"\n{'='*60}")
    print("  DONE")
    print(f"{'='*60}")
    print(f"  Cian:  {'OK' if ok_cian else 'FAILED'}")
    print(f"  Etagi: {'OK' if ok_etagi else 'FAILED'}")


if __name__ == "__main__":
    main()
