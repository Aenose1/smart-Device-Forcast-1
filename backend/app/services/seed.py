"""Bootstrap helpers: admin account and the clearly-labelled DEMO dataset."""
from __future__ import annotations

import csv
import logging
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import Device, DeviceSpec, User
from ..security import hash_password
from . import datasets

log = logging.getLogger("app.seed")
settings = get_settings()


def ensure_admin(db: Session) -> None:
    email, pw = settings.admin_email.strip().lower(), settings.admin_password
    if not email or not pw:
        return
    if len(pw) < 8:
        log.warning("ADMIN_PASSWORD is shorter than 8 characters; admin not created")
        return
    if db.execute(select(User.id).where(User.email == email)).first():
        return
    db.add(User(email=email, full_name="Administrator", password_hash=hash_password(pw), role="admin"))
    db.commit()
    log.info("Admin account created for %s", email)


def import_devices_csv(db: Session, path) -> int:
    n = 0
    with open(path, newline="", encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            if db.get(Device, row["device_id"]):
                continue
            d = Device(id=row["device_id"], name=row["name"], brand=row["brand"], category=row["category"],
                       release_date=date.fromisoformat(row["release_date"]) if row.get("release_date") else None,
                       launch_price=float(row["launch_price"]), currency=row.get("currency") or "INR",
                       status=row.get("status") or "Active")
            for pair in filter(None, (row.get("specs") or "").split(";")):
                k, _, v = pair.partition("=")
                if k.strip() and v.strip():
                    d.specs.append(DeviceSpec(key=k.strip(), value=v.strip()))
            db.add(d)
            n += 1
    db.commit()
    return n


def seed_sample(db: Session, force: bool = False) -> dict:
    """Loads data/sample/*. The price history is SYNTHETIC and flagged is_sample=True everywhere."""
    if not force and db.execute(select(func.count()).select_from(Device)).scalar_one() > 0:
        return {"skipped": "catalogue is not empty"}
    base = settings.path(settings.sample_dir)
    n = import_devices_csv(db, base / "sample_devices.csv")
    content = (base / "sample_price_history_DEMO.csv").read_bytes()
    ds, rep = datasets.ingest_csv(db, content, "sample_price_history_DEMO.csv", None, is_sample=True)
    return {"devices": n, "history_rows": len(rep.valid_rows), "dataset_id": ds.id}
