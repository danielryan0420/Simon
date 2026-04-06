# JIT Production Scheduler Dashboard

A web-based Just-In-Time production scheduling dashboard built with Python Dash. Loads SAP/EOP export CSVs and provides Gantt visualisation, ops-floor views, material shortage tracking, and purchasing escalation — all on your internal network.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run dev server (auto-reload)
SCHEDULER_DEBUG=true python app.py

# Or run on a specific internal IP
SCHEDULER_HOST=192.168.1.50 SCHEDULER_PORT=8050 python app.py
```

## Production (gunicorn)

```bash
gunicorn -c gunicorn.conf.py app:server
```

To bind to a specific internal IP, edit `bind` in `gunicorn.conf.py`:

```python
bind = "192.168.1.50:8050"
```

Access via VPN: `http://192.168.1.50:8050`

## Data Files (`/data/`)

Drop your SAP/EOP CSV exports here. The app re-reads them on each "Reload" button press (or every 5 minutes via the dashboard auto-interval).

| File | Source | Key Columns |
|---|---|---|
| `orders.csv` | AFKO/AFPO/AUFK join | AUFNR, MATNR, GSTRS, GLTRP, LINE, GAMNG |
| `resb.csv` | RESB | AUFNR, MATNR, BDMNG, BDTER |
| `mard.csv` | MARD | MATNR, LABST, EINME |
| `eop_milestones.csv` | EOP export | AUFNR, MOUNT_TS, TEST_TS, FINAL_TS, PCT_COMPLETE |
| `marc.csv` | MARC | MATNR, DZEIT (in-house days) |
| `ekpo_open_po.csv` | EKPO/LFA1 join | EBELN, MATNR, MENGE, EINDT, NAME1 |

Sample files with realistic dummy data are included.

## Pages

| Page | URL | Description |
|---|---|---|
| Dashboard | `/` | KPI tiles, alerts, bottlenecks, semi back-calc reminders |
| Gantt Chart | `/gantt` | `px.timeline` pre/post-test bars, colour by status, click-to-edit dates |
| Ops Floor | `/ops-floor` | Next-build list by line, EOP progress, horizon slider |
| Materials & Pick | `/materials` | RESB vs stock check, shortage alerts, forklift/cart pick list, CSV export |
| Purchasing | `/purchasing` | Late PO escalation sorted by impact score |

## Status Colours

- **Green** — On-track (EOP milestone hit, no shortage)
- **Orange** — Waiting / delayed (EOP behind or approaching due date)
- **Red** — Critical (material shortage or overdue)

## Scheduling Logic

- **Pre-test phase**: MOUNT_TS → TEST_TS
- **Post-test phase**: TEST_TS → FINAL_TS
- **Semi back-calculation**: `mount_start − MARC.DZEIT` (default 5 business days)
- **Shortage check**: `RESB.BDMNG > MARD.LABST + MARD.EINME + open PO qty`

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SCHEDULER_HOST` | `0.0.0.0` | Bind host |
| `SCHEDULER_PORT` | `8050` | Bind port |
| `SCHEDULER_DEBUG` | `false` | Enable Dash debug mode |
