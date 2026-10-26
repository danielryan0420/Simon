# JIT Production Scheduler Dashboard

A web-based Just-In-Time production scheduling dashboard built with Python Dash. It loads SAP/EOP export CSVs (orders, material reservations, stock, purchase orders, EOP milestones) and gives production planners a single internal-network dashboard for scheduling, shortage tracking, and purchasing escalation.

## Who it's for

Internal production planning / ops teams who currently track build schedules, material shortages, and late purchase orders by hand from SAP exports. There is no login system — it's meant to run on a trusted internal network or over VPN, not on the public internet.

## Main features

- **Dashboard** (`/`) — KPI tiles, active alerts (critical orders, near-due orders, blocking late POs), order-status donut, orders-by-line bar chart, material bottleneck list, and upcoming "semi" (sub-component) release reminders.
- **Gantt Chart** (`/gantt`) — Pre-test / post-test timeline bars per order, colour-coded by status, with line/status/date filters, grouping, and a click-to-edit panel for adjusting dates (session-only override, does not write back to SAP).
- **Ops Floor** (`/ops-floor`) — Next-build list by production line with a due-date horizon slider and per-line summary cards.
- **Materials & Pick** (`/materials`) — Compares material requirements (RESB) against stock + incoming POs, flags shortages, classifies pick method (forklift vs. cart), and exports a pick-list CSV.
- **Purchasing** (`/purchasing`) — Open PO lines sorted by delay impact, highlighting POs that are late and/or blocking production orders.

Data is read from flat CSV files dropped into `/data/` and is reloaded on demand (reload buttons) or automatically every 5 minutes on the dashboard. There is no database — CSVs are the only data store.

## Tech stack

- **Python** + **Dash** (Plotly) for the UI and callbacks
- **Plotly Express/Graph Objects** for charts and the Gantt timeline
- **Pandas** for CSV loading, merging, and business logic (`data_loader.py`)
- **Gunicorn** for production serving
- Plain CSS (`assets/style.css`), no JS build step, no database

## Quick start

```bash
# Install dependencies
pip install -r requirements.txt

# Run dev server (auto-reload)
SCHEDULER_DEBUG=true python app.py

# Or run on a specific internal IP
SCHEDULER_HOST=192.168.1.50 SCHEDULER_PORT=8050 python app.py
```

Then open `http://localhost:8050` (or the host/port you set).

## Production (gunicorn)

```bash
gunicorn -c gunicorn.conf.py app:server
```

To bind to a specific internal IP, edit `bind` in `gunicorn.conf.py`. Access via VPN, e.g. `http://192.168.1.50:8050`.

## Data files (`/data/`)

Drop your SAP/EOP CSV exports here. Sample files with dummy data are included so the app runs out of the box.

| File | Source | Key columns |
|---|---|---|
| `orders.csv` | AFKO/AFPO/AUFK join | AUFNR, MATNR, MAKTX, GAMNG, GMEIN, GSTRS, GLTRP, LINE, STATUS, AUFART |
| `resb.csv` | RESB | AUFNR, MATNR, MAKTX, BDMNG, MEINS, BDTER, RSPOS, LGORT, BWART |
| `mard.csv` | MARD | MATNR, MAKTX, WERKS, LGORT, LABST, EINME, UMLME, INSME |
| `eop_milestones.csv` | EOP export | AUFNR, EOP_ID, MOUNT_TS, TEST_TS, FINAL_TS, CURRENT_PHASE, PCT_COMPLETE |
| `marc.csv` | MARC | MATNR, WERKS, DZEIT, BESKZ, SOBSL |
| `ekpo_open_po.csv` | EKPO/LFA1 join | EBELN, EBELP, MATNR, MAKTX, MENGE, MEINS, EINDT, NETPR, WAERS, LIFNR, NAME1, EKGRP, LOEKZ |

## Documentation

- [docs/REBUILD.md](docs/REBUILD.md) — full from-scratch rebuild guide: setup, config, project structure, data flow, deployment, gotchas.
- [docs/USER_GUIDE.md](docs/USER_GUIDE.md) — end-user guide to every page, field, and workflow.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `SCHEDULER_HOST` | `0.0.0.0` | Bind host for the dev server |
| `SCHEDULER_PORT` | `8050` | Bind port for the dev server |
| `SCHEDULER_DEBUG` | `false` | Enable Dash debug mode (auto-reload) |
