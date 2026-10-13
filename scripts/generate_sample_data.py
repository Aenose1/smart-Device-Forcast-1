"""Generates the DEMO files in data/sample.

!!! The price history produced here is SYNTHETIC. It exists only so that a fresh
!!! installation has something to show. Every row carries source = SAMPLE-DEMO-SYNTHETIC
!!! and is flagged is_sample=True in the database, in the UI and in PDF reports.
The device names/brands are fictional on purpose, so nothing here can be mistaken for
real product data. Replace it with real data via the admin CSV upload.
"""
import csv
import math
import random
from datetime import date
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "data" / "sample"
rng = random.Random(2026)

# id, name, brand, category, release, launch, months of history, monthly decay, specs
DEVICES = [
    ("LP001", "Demo Titan 16 Gaming", "Acme", "Laptop", date(2024, 3, 1), 129999, 30, 0.014, "RAM=16 GB;Storage=1 TB;Display=16 inch;GPU=Dedicated 8 GB"),
    ("LP002", "Demo Aero 14 Ultrabook", "Zenith", "Laptop", date(2024, 6, 1), 89999, 27, 0.011, "RAM=16 GB;Storage=512 GB;Display=14 inch;GPU=Integrated"),
    ("LP003", "Demo Studio 15 Creator", "Nova", "Laptop", date(2024, 1, 1), 149999, 32, 0.016, "RAM=32 GB;Storage=1 TB;Display=15.6 inch;GPU=Dedicated 12 GB"),
    ("LP004", "Demo Office 15 Everyday", "Orbit", "Laptop", date(2024, 9, 1), 54999, 24, 0.012, "RAM=8 GB;Storage=512 GB;Display=15.6 inch;GPU=Integrated"),
    ("LP005", "Demo Blade 17 Pro", "Acme", "Laptop", date(2024, 11, 1), 169999, 22, 0.017, "RAM=32 GB;Storage=2 TB;Display=17 inch;GPU=Dedicated 16 GB"),
    ("LP006", "Demo Flex 13 Convertible", "Kestrel", "Laptop", date(2025, 9, 1), 99999, 11, 0.01, "RAM=16 GB;Storage=512 GB;Display=13.3 inch;GPU=Integrated"),
    ("SP001", "Demo Nova X Ultra", "Nova", "Smartphone", date(2024, 2, 1), 124999, 31, 0.022, "RAM=12 GB;Storage=512 GB;Display=6.8 inch;Battery=5000 mAh;Camera=200 MP"),
    ("SP002", "Demo Orbit 9 Pro", "Orbit", "Smartphone", date(2024, 5, 1), 99999, 28, 0.02, "RAM=12 GB;Storage=256 GB;Display=6.7 inch;Battery=4800 mAh;Camera=50 MP"),
    ("SP003", "Demo Zenith S Lite", "Zenith", "Smartphone", date(2024, 8, 1), 34999, 25, 0.018, "RAM=8 GB;Storage=128 GB;Display=6.5 inch;Battery=5000 mAh;Camera=64 MP"),
    ("SP004", "Demo Kestrel One", "Kestrel", "Smartphone", date(2024, 4, 1), 69999, 29, 0.021, "RAM=8 GB;Storage=256 GB;Display=6.4 inch;Battery=4500 mAh;Camera=50 MP"),
    ("SP005", "Demo Acme Fold", "Acme", "Smartphone", date(2024, 10, 1), 159999, 23, 0.025, "RAM=12 GB;Storage=512 GB;Display=7.6 inch;Battery=4400 mAh;Camera=50 MP"),
    ("SP006", "Demo Nova Mini", "Nova", "Smartphone", date(2025, 8, 1), 44999, 12, 0.015, "RAM=6 GB;Storage=128 GB;Display=6.1 inch;Battery=4000 mAh;Camera=48 MP"),
]
END = date(2026, 9, 1)


def month_add(d: date, n: int) -> date:
    m = d.month - 1 + n
    return date(d.year + m // 12, m % 12 + 1, 1)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with open(OUT / "sample_devices.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["device_id", "name", "brand", "category", "release_date", "launch_price", "currency", "status", "specs"])
        for d in DEVICES:
            w.writerow([d[0], d[1], d[2], d[3], d[4].isoformat(), d[5], "INR", "Active", d[8]])
    with open(OUT / "sample_price_history_DEMO.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["device_id", "device_name", "category", "date", "price", "source", "currency"])
        for did, name, _b, cat, rel, launch, months, decay, _s in DEVICES:
            first = month_add(END, -(months - 1))
            for i in range(months):
                d = month_add(first, i)
                age = (d.year - rel.year) * 12 + d.month - rel.month
                price = launch * math.exp(-decay * age) * (1 + rng.gauss(0, 0.012))
                if d.month in (10, 11):  # festive-season promotions
                    price *= 1 - rng.uniform(0.02, 0.05)
                w.writerow([did, name, cat, d.isoformat(), round(price / 10) * 10, "SAMPLE-DEMO-SYNTHETIC", "INR"])
    print("Wrote", OUT)


if __name__ == "__main__":
    main()
