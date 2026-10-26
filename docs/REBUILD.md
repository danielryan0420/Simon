# Rebuild Guide

Complete instructions to recreate this repository from scratch, including every config value, data dependency, and gotcha. Read this alongside `README.md`.

## 1. What this app is

A single-process Python **Dash** web app (`app.py`) with no database and no authentication. All "business data" comes from six CSV files in `/data/` that mimic exports from SAP tables (AFKO/AFPO/AUFK, RESB, MARD, MARC, EKPO/LFA1) plus one custom "EOP" (End-of-Production / milestone tracking) export. `data_loader.py` reads, merges, and derives all scheduling/shortage logic from those CSVs; `pages/*.py` render the five UI pages and their Dash callbacks; `app.py` wires up the shell layout, routing, and callback registration.

There is no build step, no bundler, no ORM, and no migrations — this is as simple as a Python web app gets.

## 2. Prerequisites

- **Python 3.10+** (the code uses `list[str] | None` style type hints, which require 3.10+)
- `pip` for installing dependencies
- No system database, no Node.js, no external services required
- For production: a Linux host capable of running **gunicorn**

## 3. Cloning and installing

```bash
git clone <repo-url>
cd Simon
python -m venv venv && source venv/bin/activate   # optional but recommended
pip install -r requirements.txt
```

`requirements.txt` pins (minimum versions):

| Package | Purpose |
|---|---|
| `dash` | Web framework, layout components, callback system |
| `plotly` | Charting engine underlying Dash (`plotly.express`, `plotly.graph_objects`) |
| `pandas` | CSV loading, merging, all derived-column business logic |
| `gunicorn` | Production WSGI server |
| `uvicorn` | Listed as a dependency but not referenced anywhere in the code; gunicorn uses the `sync` worker class by default, so uvicorn is currently unused unless you switch `worker_class` to `uvicorn.workers.UvicornWorker` in `gunicorn.conf.py` |

## 4. Configuration / environment variables

All configuration is via environment variables read in `app.py`'s `__main__` block. There is no `.env` file or secrets management in this repo.

| Variable | Default | Purpose |
|---|---|---|
| `SCHEDULER_HOST` | `0.0.0.0` | Host the dev server binds to |
| `SCHEDULER_PORT` | `8050` | Port the dev server binds to |
| `SCHEDULER_DEBUG` | `false` | When `"true"` (case-insensitive), enables Dash debug mode (hot reload, dev error overlay) |

For production, `gunicorn.conf.py` hardcodes `bind = "0.0.0.0:8050"` (edit directly to change — it is not read from an env var) and sets:
- `workers = (2 × CPU cores) + 1`
- `worker_class = "sync"` (swap to `"uvicorn.workers.UvicornWorker"` for async)
- `threads = 2`, `timeout = 120`, `keepalive = 5`
- Access/error logs to stdout/stderr

## 5. Data setup (no database)

There is no database. All state is in six CSVs under `/data/`, loaded fresh from disk on every "Reload" click and on a 5-minute `dcc.Interval` on the dashboard page only (other pages reload on their own button click or filter change — see §8 Gotchas). To rebuild the data layer:

1. Create `/data/` at the repo root.
2. Populate these six files with the exact column headers below (column names only — do not copy real SAP data into a public repo):

   - `orders.csv` — `AUFNR, MATNR, MAKTX, GAMNG, GMEIN, GSTRS, GLTRP, LINE, STATUS, AUFART` (production order header: order number, material, description, quantity, unit, start date, target completion date, production line, status, order type)
   - `resb.csv` — `AUFNR, MATNR, MAKTX, BDMNG, MEINS, BDTER, RSPOS, LGORT, BWART` (material reservations per order: required qty, unit, need date, reservation item, storage location, movement type)
   - `mard.csv` — `MATNR, MAKTX, WERKS, LGORT, LABST, EINME, UMLME, INSME` (stock per material/plant/storage location: unrestricted stock, stock in transit, stock in transfer, stock in QA)
   - `eop_milestones.csv` — `AUFNR, EOP_ID, MOUNT_TS, TEST_TS, FINAL_TS, CURRENT_PHASE, PCT_COMPLETE` (custom milestone export, not a standard SAP table: mount/test/final timestamps, current build phase, percent complete)
   - `marc.csv` — `MATNR, WERKS, DZEIT, BESKZ, SOBSL` (material plant data: in-house production days, procurement type, special procurement key)
   - `ekpo_open_po.csv` — `EBELN, EBELP, MATNR, MAKTX, MENGE, MEINS, EINDT, NETPR, WAERS, LIFNR, NAME1, EKGRP, LOEKZ` (open PO lines joined with vendor master: PO number/item, qty, unit, delivery date, net price, currency, vendor number/name, purchasing group, deletion flag)

3. All numeric and date columns are read as strings by `pandas.read_csv(..., dtype=str)` and then explicitly coerced (`pd.to_numeric`/`pd.to_datetime` with `errors="coerce"`) in `data_loader.py`'s `load_*` functions — malformed values become `NaN`/`NaT` rather than raising, so the app won't crash on partial export data, but rows with bad dates will silently drop out of date-based filters.
4. If a CSV file is missing entirely, `_read_csv()` logs a warning and returns an empty DataFrame — pages degrade gracefully (empty tables / "No data" messages) rather than crashing.

## 6. Running locally

```bash
SCHEDULER_DEBUG=true python app.py
```

Visit `http://localhost:8050`. The sidebar links to all five pages. Edit a CSV in `/data/` and click a page's "Reload" button (or wait up to 5 minutes on the dashboard) to see changes — no server restart needed.

## 7. Tests

**There are no automated tests in this repository** (no `tests/` directory, no test runner configured). If you rebuild this app and want test coverage, you would need to add it — a reasonable starting point would be unit tests around the pure functions in `data_loader.py` (`build_schedule`, `merge_materials`, `build_purchasing_escalation`), since those contain all the business logic and take no Dash/web dependencies.

## 8. Building / deploying

No build step (no JS bundler, no compiled assets beyond the static `assets/style.css`, which Dash serves automatically from the `/assets` folder by convention).

Production deploy:

```bash
gunicorn -c gunicorn.conf.py app:server
```

`app:server` refers to `server = app.server` in `app.py` — the underlying Flask app that Dash wraps, which is what gunicorn's sync workers actually run. To change the bind address for a specific internal IP/VPN setup, edit `bind` in `gunicorn.conf.py` directly (no env var override exists today).

There is no containerization (no Dockerfile) and no CI config in this repo. Deployment is "copy the repo + CSVs to a host, run gunicorn."

## 9. Project structure

```
app.py                  # Entry point: Dash app init, sidebar/shell layout, URL router, callback registration
data_loader.py           # All CSV I/O, merging, and derived business logic (no Dash dependency)
gunicorn.conf.py         # Production WSGI server config (workers, binding, logging)
requirements.txt         # Pinned minimum dependency versions
assets/style.css         # Dark-theme CSS, auto-served by Dash from /assets
data/*.csv               # Sample/mock SAP+EOP export data (see §5)
pages/__init__.py        # Empty — marks pages/ as a package
pages/dashboard.py        # "/" — KPI tiles, alerts, donut + bar charts, bottlenecks, semi reminders
pages/gantt.py             # "/gantt" — px.timeline Gantt chart, filters, click-to-edit date overrides
pages/ops_floor.py         # "/ops-floor" — next-build table by line, horizon slider, per-line cards
pages/materials.py         # "/materials" — shortage table, pick-method classification, CSV export
pages/purchasing.py        # "/purchasing" — late/blocking PO escalation table
```

Each `pages/*.py` module exposes exactly two functions used by `app.py`:
- `layout()` — returns the page's Dash component tree (called by the router on navigation)
- `register_callbacks(app)` — registers that page's `@app.callback` functions against the global `app` instance (called once at import time in `app.py`)

## 10. Data flow

1. CSVs in `/data/` are the source of truth.
2. `data_loader.py` functions load and type-coerce each file (`load_orders`, `load_resb`, `load_mard`, `load_eop`, `load_marc`, `load_open_po`).
3. Three derived datasets combine them:
   - `build_schedule()` — merges `orders` + `eop_milestones`, derives Gantt bar start/end dates (`pre_start/pre_end` = mount→test, `post_start/post_end` = test→final, falling back to `GSTRS`/`GLTRP` when EOP timestamps are missing), computes `semi_latest_start` (mount date minus `DEFAULT_SEMI_LEAD_DAYS` = 5 business days, used for "start semis now" reminders), and assigns a `STATUS_COLOR` (green/orange/red/grey) per order.
   - `merge_materials()` — merges `resb` + `orders` + `mard` + `marc` + `open_po`; computes `available` (LABST + EINME), `net_available` (+ open PO qty), `shortage_qty` (required − net available, floored at 0), `is_short`, a rough `recovery_days` heuristic, and `PICK_TYPE` (FORKLIFT if `MATNR` starts with `RM-HOUSING` or `RM-BODY`, else CART — this prefix convention is hardcoded, not configurable).
   - `build_purchasing_escalation()` — takes `open_po`, computes `days_late` vs. today, flags `blocks_order` (PO's material is on the short list from `merge_materials()`), joins the earliest order start date that needs that material, and sorts by `blocks_order` then `impact_score` (`days_late × MENGE`).
4. `reload_all()` bundles all three into a dict and is called by the dashboard page's refresh callback. Other pages call the individual `build_*`/`merge_*` functions directly in their own callbacks rather than going through `reload_all()`.
5. Everything is recomputed from the CSVs on every reload — there is no caching layer and no incremental update; a full reload re-reads and re-merges all six files.
6. The Gantt page additionally supports **session-local date overrides**: clicking a bar opens an edit form; "Save Changes" writes `{AUFNR: {pre_start, post_end}}` into a `dcc.Store(storage_type="session")` (browser session storage, not disk). These overrides are applied on top of the freshly-loaded schedule at render time and are lost if the browser session ends or "Reset to SAP" is clicked — they never get written back to any CSV or SAP system.

## 11. External integrations

- **SAP**: not a live integration. The app only consumes flat-file CSV *exports* that mimic SAP tables (AFKO/AFPO/AUFK, RESB, MARD, MARC, EKPO/LFA1). There is no SAP RFC/BAPI/OData connection anywhere in the code — someone (or some other scheduled export job outside this repo) must produce these CSVs and drop them into `/data/`.
- **No other external integrations** (no email/Gmail, no auth provider, no cloud storage, no message queue, no third-party APIs). Everything runs self-contained on one host.

## 12. Known gotchas

- **Column name coupling**: Business logic keys off exact SAP-style column names (`AUFNR`, `MATNR`, `BDMNG`, etc.) across multiple files. Renaming a column in one CSV without updating `data_loader.py` and the relevant `pages/*.py` rename dicts will silently drop that field from the UI rather than erroring loudly.
- **No locking / concurrency control**: If two users click "Reload" at once, or a CSV is being rewritten by an external export job while the app reads it, you may get a partial/corrupt read — `pandas.read_csv` has no retry logic here.
- **Session overrides aren't real edits**: Gantt "Save Changes" only affects what the *current browser session* sees; it's easy to assume it persists across users/devices when it does not.
- **5-minute auto-refresh is dashboard-only**: Other pages (Gantt, Ops Floor, Materials, Purchasing) only refresh on their own button click or when a filter/dropdown changes — they do not share the dashboard's `dcc.Interval`.
- **`PICK_TYPE` heuristic is hardcoded**: Forklift-vs-cart classification is a string-prefix check (`RM-HOUSING`/`RM-BODY`) inside `merge_materials()`, not a data-driven lookup — new material prefixes won't be classified correctly without a code change.
- **`uvicorn` is in requirements.txt but unused** under the default sync worker — don't assume async serving is active without changing `worker_class`.
- **No auth, no HTTPS**: the app binds to `0.0.0.0` by default and is meant for an internal network/VPN only; do not expose it to the public internet as-is.
- **Debug mode**: `SCHEDULER_DEBUG=true` enables Dash's Flask debug server, which is not suitable for production (and the comparison is case-insensitive but exact-string `"true"` only — e.g. `1` will not enable it).
