import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import APIRouter, Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session

from .config import get_settings
from .db import Base, SessionLocal, engine, get_db
from .errors import install_handlers
from .routers import admin, auth, dashboard, devices, predictions, public
from .services import seed

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    settings.path(settings.models_dir).mkdir(parents=True, exist_ok=True)
    settings.path(settings.uploads_dir).mkdir(parents=True, exist_ok=True)
    with SessionLocal() as db:
        seed.ensure_admin(db)
        if settings.seed_sample_data:
            logging.getLogger("app").info("Sample seed: %s", seed.seed_sample(db))
    yield


app = FastAPI(title="Smart Device Price Prediction & 3-Year Forecasting System", version="1.0.0", lifespan=lifespan,
              docs_url="/api/docs", openapi_url="/api/openapi.json", redoc_url=None)

install_handlers(app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://smart-device-forcast-1.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https://smart-device-forcast-1(?:-[a-z0-9-]+)*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.middleware("http")
async def security_headers(request: Request, call_next):
    resp = await call_next(request)
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("X-Frame-Options", "DENY")
    resp.headers.setdefault("Referrer-Policy", "same-origin")
    if request.url.path.startswith("/api/") and not request.url.path.startswith("/api/docs"):
        resp.headers.setdefault("Cache-Control", "no-store")
    return resp


api = APIRouter(prefix="/api")

@api.get("/health", tags=["meta"])
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok"}


for r in (auth.router, public.router, devices.router, predictions.router, dashboard.router, admin.router):
    api.include_router(r)
app.include_router(api)

# --- serve the built React app (single-container deployment) -----------------------------------
_dist = settings.path(settings.frontend_dist)
if settings.serve_frontend and (_dist / "index.html").exists():
    if (_dist / "assets").exists():
        app.mount("/assets", StaticFiles(directory=_dist / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str):
        if full_path.startswith("api/"):
            return JSONResponse({"detail": "Resource not found.", "code": "http_error"}, status_code=404)
        f = (_dist / full_path).resolve()
        if full_path and _dist.resolve() in f.parents and f.is_file():
            return FileResponse(f)
        return FileResponse(_dist / "index.html")