"""Generates the sample catalogue + DEMO price history in data/sample.

CATALOGUE (devices.csv)  Real, recognisable models from popular brands. Specifications and the launch price are
                         APPROXIMATE REFERENCE values compiled from public launch information (India, INR) and may
                         differ from the exact variant or the current street price. Verify before relying on them.
PRICE HISTORY            !!! SYNTHETIC !!! A smooth depreciation curve + noise starting at the reference launch price.
                         It is NOT market data. Every row carries source = SAMPLE-DEMO-SYNTHETIC and is stored with
                         is_sample = True; the UI, forecasts and PDF reports label it as demo data.
Replace the history with real data through Admin -> Datasets (CSV upload).

Run:  python -m scripts.generate_sample_data
"""
import csv
import math
import random
from datetime import date
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "data" / "sample"
END = date(2026, 9, 1)  # last month of the synthetic history

# ---- Smartphones: brand, model, release YYYY-MM, launch INR, RAM GB, storage GB, display in, battery mAh, camera MP, processor
PHONES = [
    ("OnePlus", "OnePlus 12", "2024-01", 64999, 12, 256, 6.82, 5400, 50, "Snapdragon 8 Gen 3"),
    ("OnePlus", "OnePlus 13", "2025-01", 69999, 12, 256, 6.82, 6000, 50, "Snapdragon 8 Elite"),
    ("OnePlus", "OnePlus 13R", "2025-01", 42999, 12, 256, 6.78, 6000, 50, "Snapdragon 8 Gen 3"),
    ("OnePlus", "OnePlus Nord 4", "2024-07", 29999, 8, 128, 6.74, 5500, 50, "Snapdragon 7+ Gen 3"),
    ("OnePlus", "OnePlus Nord CE4", "2024-04", 24999, 8, 128, 6.7, 5500, 50, "Snapdragon 7 Gen 3"),
    ("Redmi", "Redmi Note 13 Pro+ 5G", "2024-01", 31999, 8, 256, 6.67, 5000, 200, "Dimensity 7200 Ultra"),
    ("Redmi", "Redmi Note 13 5G", "2024-01", 17999, 6, 128, 6.67, 5000, 108, "Dimensity 6080"),
    ("Redmi", "Redmi Note 14 Pro+ 5G", "2024-12", 29999, 8, 256, 6.67, 5110, 50, "Snapdragon 7s Gen 3"),
    ("Redmi", "Redmi Note 14 5G", "2024-12", 17999, 6, 128, 6.67, 5110, 50, "Dimensity 7025 Ultra"),
    ("Redmi", "Redmi 13 5G", "2024-07", 13999, 6, 128, 6.79, 5030, 108, "Snapdragon 4 Gen 2 AE"),
    ("Xiaomi", "Xiaomi 14", "2024-02", 69999, 12, 256, 6.36, 4610, 50, "Snapdragon 8 Gen 3"),
    ("Xiaomi", "Xiaomi 14 Civi", "2024-06", 42999, 8, 256, 6.55, 4700, 50, "Snapdragon 8s Gen 3"),
    ("Xiaomi", "Xiaomi 15", "2025-03", 64999, 12, 256, 6.36, 5240, 50, "Snapdragon 8 Elite"),
    ("Samsung", "Samsung Galaxy S24", "2024-01", 79999, 8, 256, 6.2, 4000, 50, "Exynos 2400"),
    ("Samsung", "Samsung Galaxy S24 Ultra", "2024-01", 129999, 12, 256, 6.8, 5000, 200, "Snapdragon 8 Gen 3 for Galaxy"),
    ("Samsung", "Samsung Galaxy S25", "2025-02", 80999, 12, 256, 6.2, 4000, 50, "Snapdragon 8 Elite for Galaxy"),
    ("Samsung", "Samsung Galaxy A35 5G", "2024-03", 30999, 8, 128, 6.6, 5000, 50, "Exynos 1380"),
    ("Samsung", "Samsung Galaxy A55 5G", "2024-03", 39999, 8, 128, 6.6, 5000, 50, "Exynos 1480"),
    ("Samsung", "Samsung Galaxy M35 5G", "2024-07", 19999, 6, 128, 6.6, 6000, 50, "Exynos 1380"),
    ("Samsung", "Samsung Galaxy M55 5G", "2024-04", 26999, 8, 128, 6.7, 5000, 50, "Snapdragon 7 Gen 1"),
    ("Apple", "iPhone 15", "2023-09", 79900, 6, 128, 6.1, 3349, 48, "A16 Bionic"),
    ("Apple", "iPhone 16", "2024-09", 79900, 8, 128, 6.1, 3561, 48, "A18"),
    ("Apple", "iPhone 16 Pro", "2024-09", 119900, 8, 128, 6.3, 3582, 48, "A18 Pro"),
    ("Apple", "iPhone 16 Pro Max", "2024-09", 144900, 8, 256, 6.9, 4685, 48, "A18 Pro"),
    ("Apple", "iPhone 16e", "2025-02", 59900, 8, 128, 6.1, 4005, 48, "A18"),
    ("vivo", "vivo V30", "2024-03", 33999, 8, 128, 6.78, 5000, 50, "Snapdragon 7 Gen 3"),
    ("vivo", "vivo V40", "2024-08", 34999, 8, 128, 6.78, 5500, 50, "Snapdragon 7 Gen 3"),
    ("vivo", "vivo V50", "2025-02", 34999, 8, 128, 6.77, 6000, 50, "Snapdragon 7 Gen 3"),
    ("vivo", "vivo T3 5G", "2024-03", 19999, 8, 128, 6.67, 5000, 50, "Dimensity 7200"),
    ("vivo", "vivo T3 Ultra 5G", "2024-09", 31999, 8, 128, 6.78, 5500, 50, "Dimensity 9200+"),
    ("vivo", "vivo T4 5G", "2025-03", 21999, 8, 128, 6.77, 7300, 50, "Snapdragon 7s Gen 3"),
    ("OPPO", "OPPO Reno11 5G", "2024-01", 29999, 8, 128, 6.7, 5000, 50, "Dimensity 7050"),
    ("OPPO", "OPPO Reno12 Pro 5G", "2024-07", 36999, 12, 256, 6.7, 5000, 50, "Dimensity 7300 Energy"),
    ("OPPO", "OPPO Reno13 Pro 5G", "2025-01", 49999, 12, 256, 6.83, 5800, 50, "Dimensity 8350"),
    ("OPPO", "OPPO A3 Pro 5G", "2024-04", 17999, 8, 128, 6.67, 5000, 50, "Dimensity 6300"),
    ("OPPO", "OPPO A59 5G", "2023-12", 14999, 4, 128, 6.56, 5000, 13, "Dimensity 6020"),
    ("realme", "realme 13 Pro+ 5G", "2024-07", 32999, 8, 128, 6.7, 5000, 50, "Snapdragon 7s Gen 2"),
    ("realme", "realme 14 Pro+ 5G", "2025-01", 29999, 8, 128, 6.83, 6000, 50, "Snapdragon 7s Gen 3"),
    ("realme", "realme GT 6", "2024-06", 40999, 12, 256, 6.78, 5500, 50, "Snapdragon 8s Gen 3"),
    ("realme", "realme Narzo 70 Pro 5G", "2024-03", 19999, 8, 128, 6.67, 5000, 50, "Dimensity 7050"),
    ("realme", "realme Narzo 70x 5G", "2024-04", 11999, 4, 128, 6.72, 5000, 50, "Dimensity 6100+"),
    ("realme", "realme Narzo 80 Pro 5G", "2025-04", 19999, 8, 128, 6.77, 6000, 50, "Dimensity 7400"),
    ("Google", "Google Pixel 8", "2023-10", 75999, 8, 128, 6.2, 4575, 50, "Google Tensor G3"),
    ("Google", "Google Pixel 8a", "2024-05", 52999, 8, 128, 6.1, 4492, 64, "Google Tensor G3"),
    ("Google", "Google Pixel 9", "2024-08", 79999, 12, 256, 6.3, 4700, 50, "Google Tensor G4"),
    ("Google", "Google Pixel 9 Pro XL", "2024-08", 124999, 16, 256, 6.8, 5060, 50, "Google Tensor G4"),
    ("Google", "Google Pixel 9a", "2025-04", 49999, 8, 128, 6.3, 5100, 48, "Google Tensor G4"),
    ("Motorola", "Motorola Edge 50 Pro", "2024-04", 31999, 12, 256, 6.7, 4500, 50, "Snapdragon 7 Gen 3"),
    ("Motorola", "Motorola Edge 50 Fusion", "2024-05", 22999, 8, 128, 6.7, 5000, 50, "Snapdragon 7s Gen 2"),
    ("Motorola", "Motorola Edge 60 Pro", "2025-04", 29999, 8, 256, 6.67, 6000, 50, "Dimensity 8350 Extreme"),
    ("Motorola", "Moto G84 5G", "2023-09", 19999, 12, 256, 6.55, 5000, 50, "Snapdragon 695"),
    ("Motorola", "Moto G85 5G", "2024-07", 17999, 8, 128, 6.67, 5000, 50, "Snapdragon 6s Gen 3"),
    ("POCO", "POCO X6 Pro 5G", "2024-01", 26999, 8, 256, 6.67, 5000, 64, "Dimensity 8300 Ultra"),
    ("POCO", "POCO X7 Pro 5G", "2025-01", 27999, 8, 256, 6.67, 6550, 50, "Dimensity 8400 Ultra"),
    ("POCO", "POCO F6", "2024-05", 29999, 8, 256, 6.67, 5000, 50, "Snapdragon 8s Gen 3"),
    ("POCO", "POCO F7", "2025-06", 31999, 12, 256, 6.83, 6500, 50, "Snapdragon 8s Gen 4"),
    ("POCO", "POCO M6 Pro 5G", "2024-01", 9999, 4, 128, 6.79, 5000, 50, "Snapdragon 4 Gen 2"),
    ("POCO", "POCO M7 Pro 5G", "2024-12", 14999, 6, 128, 6.67, 5110, 50, "Dimensity 7025 Ultra"),
    ("Nothing", "Nothing Phone (2a)", "2024-03", 23999, 8, 128, 6.7, 5000, 50, "Dimensity 7200 Pro"),
    ("Nothing", "Nothing Phone (2a) Plus", "2024-07", 27999, 8, 256, 6.7, 5000, 50, "Dimensity 7350 Pro"),
    ("Nothing", "Nothing Phone (3a)", "2025-03", 24999, 8, 128, 6.77, 5000, 50, "Snapdragon 7s Gen 3"),
    ("Nothing", "Nothing Phone (3a) Pro", "2025-03", 29999, 8, 128, 6.77, 5000, 50, "Snapdragon 7s Gen 3"),
    ("Nothing", "Nothing Phone (3)", "2025-07", 79999, 12, 256, 6.67, 5150, 50, "Snapdragon 8s Gen 4"),
]

# ---- Laptops: brand, model, type, release YYYY-MM, launch INR, RAM, storage GB, display in, GPU, refresh Hz, processor
GP, IN = "dedicated", "integrated"
LAPTOPS = [
    ("Acer", "Acer Aspire 5 (A515-58M)", "Student", "2023-08", 54990, 16, 512, 15.6, "Intel Iris Xe", 60, "Intel Core i5-1335U"),
    ("Acer", "Acer Swift Go 14", "General", "2023-09", 74990, 16, 512, 14.0, "Intel Iris Xe", 90, "Intel Core i5-13500H"),
    ("Acer", "Acer Swift 14 AI", "General", "2024-09", 109990, 16, 1024, 14.0, "Intel Arc (integrated)", 120, "Intel Core Ultra 7 155H"),
    ("Acer", "Acer Nitro V 15", "Gaming", "2024-01", 69990, 16, 512, 15.6, "NVIDIA GeForce RTX 2050", 144, "Intel Core i5-13420H"),
    ("Acer", "Acer Nitro 16", "Gaming", "2024-02", 114990, 16, 512, 16.0, "NVIDIA GeForce RTX 4060", 165, "AMD Ryzen 7 7840HS"),
    ("Acer", "Acer Predator Helios Neo 16", "Gaming", "2024-03", 139999, 16, 1024, 16.0, "NVIDIA GeForce RTX 4060", 165, "Intel Core i7-14700HX"),
    ("Acer", "Acer Predator Helios 16", "Gaming", "2023-06", 229999, 32, 1024, 16.0, "NVIDIA GeForce RTX 4070", 240, "Intel Core i9-13900HX"),
    ("Acer", "Acer TravelMate P2", "Business", "2023-10", 62990, 16, 512, 14.0, "Intel UHD (integrated)", 60, "Intel Core i5-1335U"),
    ("ASUS", "ASUS Vivobook 15 (X1502)", "Student", "2023-06", 44990, 8, 512, 15.6, "Intel UHD (integrated)", 60, "Intel Core i5-1235U"),
    ("ASUS", "ASUS Vivobook 16", "General", "2024-02", 59990, 16, 512, 16.0, "Intel UHD (integrated)", 60, "Intel Core i5-13420H"),
    ("ASUS", "ASUS Zenbook 14 OLED (UX3405)", "General", "2024-03", 109990, 16, 512, 14.0, "Intel Arc (integrated)", 120, "Intel Core Ultra 7 155H"),
    ("ASUS", "ASUS Zenbook S 14", "General", "2024-09", 149990, 32, 1024, 14.0, "Intel Arc (integrated)", 120, "Intel Core Ultra 7 258V"),
    ("ASUS", "ASUS TUF Gaming A15", "Gaming", "2024-01", 104990, 16, 512, 15.6, "NVIDIA GeForce RTX 4060", 144, "AMD Ryzen 7 7735HS"),
    ("ASUS", "ASUS ROG Strix G16", "Gaming", "2024-02", 139990, 16, 1024, 16.0, "NVIDIA GeForce RTX 4060", 165, "Intel Core i7-13650HX"),
    ("Lenovo", "Lenovo IdeaPad Slim 3", "Student", "2024-01", 52990, 16, 512, 15.6, "Intel UHD (integrated)", 60, "Intel Core i5-13420H"),
    ("Lenovo", "Lenovo IdeaPad Slim 5", "General", "2024-03", 71990, 16, 512, 14.0, "AMD Radeon (integrated)", 60, "AMD Ryzen 7 7730U"),
    ("Lenovo", "Lenovo ThinkPad E14 Gen 5", "Business", "2023-09", 71990, 16, 512, 14.0, "Intel Iris Xe", 60, "Intel Core i5-1335U"),
    ("Lenovo", "Lenovo ThinkPad X1 Carbon Gen 12", "Business", "2024-04", 214990, 32, 1024, 14.0, "Intel Arc (integrated)", 60, "Intel Core Ultra 7 155U"),
    ("Lenovo", "Lenovo LOQ 15IRX9", "Gaming", "2024-05", 79990, 12, 512, 15.6, "NVIDIA GeForce RTX 3050", 144, "Intel Core i5-12450HX"),
    ("Lenovo", "Lenovo Legion 5i Gen 9", "Gaming", "2024-06", 159990, 16, 1024, 16.0, "NVIDIA GeForce RTX 4060", 165, "Intel Core i7-14650HX"),
    ("HP", "HP Pavilion 15", "General", "2023-07", 66990, 16, 512, 15.6, "Intel Iris Xe", 60, "Intel Core i5-1335U"),
    ("HP", "HP Pavilion Aero 13", "General", "2023-09", 69990, 16, 512, 13.3, "AMD Radeon (integrated)", 60, "AMD Ryzen 5 7535U"),
    ("HP", "HP Victus 15", "Gaming", "2023-08", 76990, 8, 512, 15.6, "NVIDIA GeForce RTX 3050", 144, "Intel Core i5-13420H"),
    ("HP", "HP OMEN 16", "Gaming", "2023-10", 164999, 16, 1024, 16.1, "NVIDIA GeForce RTX 4060", 165, "Intel Core i7-13700HX"),
    ("HP", "HP Envy x360 14", "General", "2024-02", 109999, 16, 512, 14.0, "Intel Arc (integrated)", 60, "Intel Core Ultra 5 125U"),
    ("HP", "HP EliteBook 840 G10", "Business", "2023-08", 132000, 16, 512, 14.0, "Intel Iris Xe", 60, "Intel Core i5-1335U"),
    ("Dell", "Dell Inspiron 15 (3520)", "Student", "2023-05", 52990, 8, 512, 15.6, "Intel UHD (integrated)", 120, "Intel Core i5-1235U"),
    ("Dell", "Dell Inspiron 14 Plus", "General", "2024-03", 105000, 16, 512, 14.0, "Intel Arc (integrated)", 60, "Intel Core Ultra 7 155H"),
    ("Dell", "Dell XPS 13 (9340)", "General", "2024-04", 139990, 16, 512, 13.4, "Intel Arc (integrated)", 120, "Intel Core Ultra 7 155H"),
    ("Dell", "Dell XPS 15 (9530)", "General", "2023-07", 209990, 16, 512, 15.6, "NVIDIA GeForce RTX 4050", 60, "Intel Core i7-13700H"),
    ("Dell", "Dell G15 (5530)", "Gaming", "2023-06", 94990, 16, 512, 15.6, "NVIDIA GeForce RTX 3050", 120, "Intel Core i5-13450HX"),
    ("Dell", "Alienware m16 R2", "Gaming", "2024-05", 249990, 32, 1024, 16.0, "NVIDIA GeForce RTX 4070", 240, "Intel Core Ultra 9 185H"),
    ("Dell", "Dell Latitude 3440", "Business", "2023-07", 62990, 8, 512, 14.0, "Intel Iris Xe", 60, "Intel Core i5-1335U"),
    ("MSI", "MSI Thin 15 (B13UC)", "Gaming", "2023-06", 59990, 8, 512, 15.6, "NVIDIA GeForce RTX 3050", 144, "Intel Core i5-13420H"),
    ("MSI", "MSI Katana 15", "Gaming", "2024-01", 109990, 16, 1024, 15.6, "NVIDIA GeForce RTX 4060", 144, "Intel Core i7-13620H"),
    ("MSI", "MSI Cyborg 15", "Gaming", "2024-02", 79990, 16, 512, 15.6, "NVIDIA GeForce RTX 4060", 144, "Intel Core i7-12650H"),
    ("MSI", "MSI Raider GE78 HX", "Gaming", "2023-07", 329990, 32, 2048, 17.0, "NVIDIA GeForce RTX 4080", 240, "Intel Core i9-13980HX"),
    ("MSI", "MSI Stealth 16 AI Studio", "Gaming", "2024-04", 299990, 32, 2048, 16.0, "NVIDIA GeForce RTX 4070", 240, "Intel Core Ultra 9 185H"),
    ("Apple", "Apple MacBook Air 13 (M2)", "General", "2022-07", 99900, 8, 256, 13.6, "Apple M2 GPU (integrated)", 60, "Apple M2"),
    ("Apple", "Apple MacBook Air 13 (M3)", "General", "2024-03", 114900, 8, 256, 13.6, "Apple M3 GPU (integrated)", 60, "Apple M3"),
    ("Apple", "Apple MacBook Air 15 (M3)", "General", "2024-03", 134900, 8, 256, 15.3, "Apple M3 GPU (integrated)", 60, "Apple M3"),
    ("Apple", "Apple MacBook Air 13 (M4)", "General", "2025-03", 99900, 16, 256, 13.6, "Apple M4 GPU (integrated)", 60, "Apple M4"),
    ("Apple", "Apple MacBook Pro 14 (M3)", "Business", "2023-11", 169900, 8, 512, 14.2, "Apple M3 GPU (integrated)", 120, "Apple M3"),
    ("Apple", "Apple MacBook Pro 14 (M4)", "Business", "2024-11", 169900, 16, 512, 14.2, "Apple M4 GPU (integrated)", 120, "Apple M4"),
    ("Apple", "Apple MacBook Pro 16 (M4 Pro)", "Business", "2024-11", 249900, 24, 512, 16.2, "Apple M4 Pro GPU (integrated)", 120, "Apple M4 Pro"),
    ("Samsung", "Samsung Galaxy Book3", "Student", "2023-05", 56990, 8, 512, 15.6, "Intel Iris Xe", 60, "Intel Core i5-1335U"),
    ("Samsung", "Samsung Galaxy Book4", "General", "2024-02", 63990, 16, 512, 15.6, "Intel Iris Xe", 60, "Intel Core i5-1335U"),
    ("Samsung", "Samsung Galaxy Book4 Pro", "General", "2024-03", 155990, 16, 512, 14.0, "Intel Arc (integrated)", 120, "Intel Core Ultra 7 155H"),
    ("Microsoft", "Microsoft Surface Laptop Go 3", "Student", "2023-10", 64999, 8, 256, 12.4, "Intel Iris Xe", 60, "Intel Core i5-1235U"),
    ("Microsoft", "Microsoft Surface Laptop 6", "Business", "2024-04", 129999, 16, 256, 13.5, "Intel Arc (integrated)", 120, "Intel Core Ultra 5 135H"),
    ("Microsoft", "Microsoft Surface Laptop 7", "General", "2024-06", 116999, 16, 256, 13.8, "Qualcomm Adreno (integrated)", 120, "Snapdragon X Plus"),
    ("Gigabyte", "Gigabyte G5 (KF5)", "Gaming", "2023-04", 77990, 8, 512, 15.6, "NVIDIA GeForce RTX 4060", 144, "Intel Core i5-12500H"),
    ("Gigabyte", "Gigabyte G6X", "Gaming", "2024-03", 105000, 16, 1024, 16.0, "NVIDIA GeForce RTX 4060", 165, "Intel Core i7-13650HX"),
    ("Gigabyte", "Gigabyte AORUS 15 (BKF)", "Gaming", "2023-05", 129990, 16, 1024, 15.6, "NVIDIA GeForce RTX 4060", 165, "Intel Core i7-13700H"),
    ("Gigabyte", "Gigabyte AORUS 16X", "Gaming", "2024-04", 209990, 32, 1024, 16.0, "NVIDIA GeForce RTX 4070", 165, "Intel Core i9-14900HX"),
]

# monthly depreciation by brand/type (synthetic demo curve)
PHONE_DECAY = {"Apple": 0.006, "Google": 0.014, "Samsung": 0.012, "Nothing": 0.015, "OnePlus": 0.014}
LAPTOP_DECAY = {"Apple": 0.006, "Gaming": 0.011, "Business": 0.008, "General": 0.009, "Student": 0.010}


def ym(s: str) -> date:
    y, m = s.split("-")
    return date(int(y), int(m), 1)


def month_add(d: date, n: int) -> date:
    m = d.month - 1 + n
    return date(d.year + m // 12, m % 12 + 1, 1)


def build_devices():
    out = []
    for i, p in enumerate(PHONES, start=101):
        brand, name, rel, price, ram, sto, disp, bat, cam, cpu = p
        specs = (f"RAM={ram} GB;Storage={sto} GB;Display={disp} inch;Battery={bat} mAh;Camera={cam} MP;Processor={cpu}")
        out.append((f"SP{i}", name, brand, "Smartphone", ym(rel), price, specs, PHONE_DECAY.get(brand, 0.017)))
    for i, l in enumerate(LAPTOPS, start=101):
        brand, name, kind, rel, price, ram, sto, disp, gpu, hz, cpu = l
        sto_txt = f"{sto // 1024} TB" if sto >= 1024 else f"{sto} GB"
        specs = (f"RAM={ram} GB;Storage={sto_txt};Display={disp} inch;GPU={gpu};Refresh rate={hz} Hz;Processor={cpu};Laptop type={kind}")
        decay = LAPTOP_DECAY["Apple"] if brand == "Apple" else LAPTOP_DECAY[kind]
        out.append((f"LP{i}", name, brand, "Laptop", ym(rel), price, specs, decay))
    return out


def main() -> None:
    rng = random.Random(2026)
    OUT.mkdir(parents=True, exist_ok=True)
    devices = build_devices()
    ids = [d[0] for d in devices]
    assert len(ids) == len(set(ids)) and len({d[1] for d in devices}) == len(devices), "duplicate id or name"
    with open(OUT / "sample_devices.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["device_id", "name", "brand", "category", "release_date", "launch_price", "currency", "status", "specs"])
        for did, name, brand, cat, rel, price, specs, _ in devices:
            w.writerow([did, name, brand, cat, rel.isoformat(), price, "INR", "Active", specs])
    rows = 0
    with open(OUT / "sample_price_history_DEMO.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["device_id", "device_name", "category", "date", "price", "source", "currency"])
        for did, name, brand, cat, rel, price, specs, decay in devices:
            months = min(36, (END.year - rel.year) * 12 + END.month - rel.month + 1)
            first = month_add(END, -(months - 1))
            for i in range(months):
                d = month_add(first, i)
                age = (d.year - rel.year) * 12 + d.month - rel.month
                p = price * math.exp(-decay * age) * (1 + rng.gauss(0, 0.012))
                if d.month in (10, 11):  # festive-season promotions
                    p *= 1 - rng.uniform(0.02, 0.05)
                w.writerow([did, name, cat, d.isoformat(), max(500, round(p / 10) * 10), "SAMPLE-DEMO-SYNTHETIC", "INR"])
                rows += 1
    print(f"Wrote {len(devices)} devices and {rows} synthetic price rows to {OUT}")


if __name__ == "__main__":
    main()
