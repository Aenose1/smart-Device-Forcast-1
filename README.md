# Smart Device Price Prediction & 3-Year Forecasting System

Full-stack app that shows historical prices for laptops and smartphones and produces **estimated** future prices
(1-5 years, default 3). Stack: React + TypeScript + Tailwind, FastAPI, SQLAlchemy (SQLite for local use, PostgreSQL for
Docker/production), scikit-learn / statsmodels, reportlab (PDF).

> Forecasts are estimates based on historical price patterns and may differ from actual market prices.
> The data in `data/sample` is **synthetic demo data**, labelled as such everywhere. Use real CSVs for real forecasts.

---------------------------------------------------------------------------------------------------------

## Run it on Windows (PowerShell + VS Code)

You need: **Python 3.10-3.13** (tick "Add python.exe to PATH" in the installer) and **Node.js 18+** (nodejs.org, LTS).
Check with `python --version` and `node --version`.

### Step 1. Extract and open the RIGHT folder

Extract `smart-device-forecast-fixed.zip` (right-click -> Extract All). In VS Code choose **File -> Open Folder** and select
the folder that **directly contains** `requirements.txt`, `README.md`, `backend`, `frontend` and `ml`.
Then open a terminal: **Terminal -> New Terminal** (PowerShell).

Check you are in the right place. This must print `True`:

```powershell
Test-Path requirements.txt
```

If it prints `False` (or you see "Could not open requirements file ... 'requirements.txt'"), you are one folder too high or
too low. Run `dir` and `cd` into the folder that contains `requirements.txt`.

### Step 2. Create and activate a virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell says *"running scripts is disabled on this system"*, allow scripts **for this terminal window only**, then activate again:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

You should see `(.venv)` at the start of the prompt. When VS Code asks to use the new environment, click **Yes**
(or Ctrl+Shift+P -> "Python: Select Interpreter" -> the one in `.venv`).

### Step 3. Install the Python packages

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4. Configure environment variables

```powershell
Copy-Item .env.example .env
```

Open `.env` and change **these four lines** (leave the rest). Do not put spaces around `=`:

```
DATABASE_URL=sqlite:///./dev.db
JWT_SECRET=type-any-long-random-text-of-at-least-32-characters
ADMIN_PASSWORD=choose-a-password-8-or-more-characters
SEED_SAMPLE_DATA=true
```

`DATABASE_URL=sqlite:///./dev.db` uses a local file database (no installation needed). The PostgreSQL line in
`.env.example` only works if you run PostgreSQL (see Docker below). `SEED_SAMPLE_DATA=true` loads the synthetic demo catalogue.
The app refuses to start if `JWT_SECRET` is missing or shorter than 32 characters.

### Step 5. Initialise the database

```powershell
python -m scripts.seed --sample
```

This creates the tables, the admin account (`ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`; default e-mail `admin@example.com`)
and loads the demo devices and demo price history. (The backend also creates the tables itself on startup, so this step is
only needed for the admin account and demo data.)

### Step 6. Start the backend (leave this terminal open)

```powershell
uvicorn backend.app.main:app --reload --port 8000
```

- Health check: http://localhost:8000/api/health  (should show `{"status":"ok"}`)
- API documentation (Swagger): http://localhost:8000/api/docs

### Step 7. Start the frontend (second terminal)

Click the **+** in the terminal panel to open a new PowerShell, then:

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The dev server forwards `/api` requests to the backend on port 8000, so the backend must be running.

### Step 8. Sign in

- Admin: `admin@example.com` with the `ADMIN_PASSWORD` from `.env` (admin menu appears in the sidebar).
- Normal user: **Create account** on the landing page.

### Run the tests (optional)

With the virtual environment active, from the project root:

```powershell
pytest -q
```

Tests use a temporary database and do not touch `dev.db`.

---------------------------------------------------------------------------------------------------------

## Troubleshooting

| Message | Cause and fix |
|---|---|
| `Could not open requirements file ... requirements.txt` | Wrong folder. `cd` into the folder that contains `requirements.txt` (Step 1). |
| `running scripts is disabled` | Use the `Set-ExecutionPolicy -Scope Process ...` command in Step 2. |
| `ModuleNotFoundError: No module named 'backend'` | Run uvicorn/seed/pytest from the project root, not from `frontend`. |
| `ValidationError ... jwt_secret` / `database_url Field required` | `.env` missing, misnamed, or `JWT_SECRET` shorter than 32 characters. |
| `connection refused` on port 5432 | `.env` still has the PostgreSQL URL; use `sqlite:///./dev.db` for local runs. |
| Frontend loads but shows "Cannot reach the server" | Backend (Step 6) is not running. |
| No devices in the list | `SEED_SAMPLE_DATA=true` was not set; delete `dev.db`, set it, run Step 5 again. |
| `pip` tries to compile packages / fails to build | Use Python 3.10-3.13 64-bit; avoid pre-release Python versions. |
| `uvicorn is not recognized` | The virtual environment is not active (Step 2), or packages are not installed (Step 3). |

## Docker (PostgreSQL) alternative
```bash
cp .env.example .env            # set JWT_SECRET, POSTGRES_PASSWORD, ADMIN_PASSWORD (keep the PostgreSQL DATABASE_URL line)
docker compose up --build       # then open http://localhost:8000
```
Docker was not run while preparing this package; see `docs/ARCHITECTURE.md` and the notes at the end of this file.

## Data workflow
1. Admin -> **Overview & devices**: add devices (ID like `LP001`, specs as `RAM=16 GB`, one per line).
2. Admin -> **Datasets**: upload CSV (`device_id,device_name,category,date,price,source,currency`, dates `YYYY-MM-DD`).
   "Validate only" is a dry run. Valid rows are stored; missing values, bad dates/prices, unknown IDs, name/category/currency
   mismatches and duplicates are reported per row. A template is in `data/price_history_template.csv`.
3. Users pick a device -> **Generate forecast** -> CSV (`device_3_year_forecast.csv`) and PDF downloads.
4. Admin -> **Models & logs**: retrain and inspect metrics. Models also retrain automatically when a device's data changes.

A device needs at least 8 distinct price dates spanning at least 90 days to be forecast.

## Project layout
`frontend/` React app - `backend/app` FastAPI (routers, services) - `ml/` forecasting pipelines (separate laptop and
smartphone pipelines) - `data/` sample + uploads - `models/` trained artifacts - `scripts/` seed / sample / schema tools -
`database/schema.sql` PostgreSQL DDL - `docs/` notes.

## Security notes
bcrypt password hashing; JWT in an httpOnly SameSite=Lax cookie (set `COOKIE_SECURE=true` behind HTTPS); logout revokes tokens
server-side; per-user data isolation; admin-only routes; request validation; parameterised SQL; CSV-only uploads with size cap;
formula-injection-safe CSV exports; rate limits on login/register/forecast; secrets only from environment variables.
Before production: HTTPS, strong `JWT_SECRET`, restricted `CORS_ORIGINS`, backups of the database and `models/`.

## API summary
Auth `POST /api/auth/{register,login,logout}`, `GET /api/auth/me` - Devices `GET /api/devices`, `/search`, `/brands`, `/{id}`, `/{id}/history[?format=csv]` -
`POST /api/predict`, `POST /api/forecast` - `GET /api/predictions[/{id}[/csv|/pdf]]` - `GET /api/dashboard` -
Admin `POST|PUT|DELETE /api/admin/devices[/{id}]`, `POST /api/admin/dataset/{upload,validate}`,
`GET /api/admin/{datasets,dataset/export,models,prediction-logs,overview}`, `POST /api/admin/models/train`.

## Verification status of this package
Verified on Linux with Python 3.12: install from `requirements.txt`, 41 backend tests, seed script, API start-up, full
forecast -> CSV/PDF flow, frontend `npm ci` + type-check + build. Windows wheels for Python 3.13 exist for every dependency
(checked with `pip download`). Not run: Docker/PostgreSQL, Python 3.13 itself, and the UI in a browser.
