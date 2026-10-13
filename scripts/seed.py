"""Usage:  python -m scripts.seed [--sample] [--force]

Creates the DB schema, the admin account (ADMIN_EMAIL / ADMIN_PASSWORD from the environment)
and optionally loads the clearly-labelled DEMO dataset from data/sample.
"""
import argparse

from backend.app.db import Base, SessionLocal, engine
from backend.app.services import seed

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--sample", action="store_true", help="load DEMO devices + synthetic demo price history")
    ap.add_argument("--force", action="store_true", help="load sample data even if devices already exist")
    a = ap.parse_args()
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed.ensure_admin(db)
        if a.sample:
            print(seed.seed_sample(db, force=a.force))
