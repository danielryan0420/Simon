# User Guide — JIT Production Scheduler Dashboard

This guide explains every screen, field, and button for day-to-day users (production planners, ops floor leads, buyers). No technical knowledge required.

## Getting started

Open the dashboard URL your IT/planning team gave you (it runs on your internal network or VPN — there is no public website and no login). You'll land on the **Dashboard** page. A left sidebar lets you jump between the five pages at any time:

- 📊 **Dashboard** — overview, alerts, KPIs
- 📅 **Gantt Chart** — visual build schedule
- 🏭 **Ops Floor** — next-build list by line
- 📦 **Materials & Pick** — shortage checks and pick lists
- 🛒 **Purchasing** — late/at-risk purchase orders

The sidebar footer reminds you data is refreshed manually or automatically, and that this tool is for internal network use only.

All data comes from CSV files your SAP/export process drops into the server's `data` folder. If a page looks empty or says "No data," it usually means the relevant CSV hasn't been loaded yet — check with whoever manages the exports.

---

## 1. Dashboard (`/`)

**Purpose**: a one-screen pulse check on the whole shop — what's on track, what's late, and what needs attention right now.

**Top bar**:
- "Last refreshed" timestamp — shows when the data was last loaded.
- **⟳ Refresh All CSVs** button — re-reads every CSV file and recalculates everything on screen. Also happens automatically every 5 minutes.

**KPI tiles** (top row of numbers):
| Tile | Meaning |
|---|---|
| Active Orders | Total production orders currently tracked |
| On-Track | Orders with green status |
| Waiting | Orders with orange status (delayed or approaching due date) |
| Critical | Orders with red status (shortage or overdue) |
| Avg Complete | Average % completion across all orders (from EOP milestone data) |
| Orders Short | Orders that have at least one short material component |
| Late POs | Open purchase orders past their delivery date |

**Active Alerts**: a running list of the most urgent items, in this order:
1. 🔴 Critical orders (material shortage or delay)
2. ⚡ Orders due within the next 3 days, with their % complete
3. ⚠ Late purchase orders that are actively blocking a production order

If nothing needs attention, you'll see "✓ No critical alerts. All systems nominal."

**Order Status Mix** (donut chart): proportion of orders that are on-track / waiting / critical.

**Orders by Line** (stacked bar chart): how many orders of each status are on each production line — useful for spotting which line has the most risk.

**Bottleneck Analysis**: the top 5 material shortages ranked by how long they'll take to recover, each showing the material, order it affects, shortage quantity, and estimated recovery days.

**Internal Semi Scheduling (5-day lead)**: reminders for "semi" (sub-component) builds that need to start within the next 7 days so the main mount date isn't missed. Color-coded: red = start today/tomorrow, orange = within 3 days, green = more time available.

---

## 2. Gantt Chart (`/gantt`)

**Purpose**: a visual timeline of every order's build phases, so you can see schedule conflicts and status at a glance.

**Filters** (top row):
- **Production Line** — show only one line, or "All Lines"
- **Status** — filter to green/orange/red/all
- **Group By** — stack bars by Line or by individual Order
- **Date Range** — only show bars overlapping the selected window

**Legend**: green = on-track, orange = waiting/delayed, red = shortage/critical; the dashed orange vertical line marks "Today."

**The chart itself**: each order shows up to two bars —
- **Pre-Test** (blue) — from mount start to test start
- **Post-Test** (purple, or red if that order has a material shortage) — from test start to final completion

Hover over any bar for order number, line, quantity, build phase, EOP % complete, and shortage warnings if applicable.

**⟳ Reload CSVs button**: re-reads the schedule data fresh from the CSVs (shows a timestamp when done).

**Editing dates**: click any bar to open an edit panel below the chart showing:
- **Mount Start** — editable date field
- **Completion End** — editable date field
- **Save Changes** — stores your edited dates *for your current browser session only*. This does **not** change the underlying CSV or SAP data — it's a what-if / local note.
- **Reset to SAP** — discards your session edit and reverts to the original CSV-derived dates.

Your saved edits disappear if you close the browser tab or clear session storage. This is meant for "what if we moved this" scenario-checking, not as a permanent schedule change tool.

---

## 3. Ops Floor (`/ops-floor`)

**Purpose**: the shop-floor view — what needs to be built next, by line, with due dates and progress.

**Filters**:
- **Production Line** — narrow to one line
- **Status** — green/orange/red/all
- **Horizon (days)** — slider from 7 to 90 days; only shows orders due within that window

**⟳ Reload button**: refreshes the data.

**Per-line summary cards**: for each production line, shows total orders, on-track count, waiting count, critical count, and average % complete — a quick line-by-line health check.

**Next Build List table**: sortable/filterable table of every matching order with:
- Order number, Description, Line, Qty, UoM (unit of measure)
- Mount Start, Due Date
- Phase (current EOP build phase) and % Done
- Status (colored dot + label)
- Days Left — colored red if under 3 days, orange if 3–6 days, green if 7+

Click any column header to sort; use the filter row under headers to search/filter specific values.

---

## 4. Materials & Pick (`/materials`)

**Purpose**: check whether you have enough stock for upcoming builds, and generate a pick list for the warehouse.

**Summary tiles**: Components (total tracked), Available, Shortages, Forklift Picks (count of components requiring forklift handling).

**Filters**:
- **Show** — All Components / Shortages Only / Available Only
- **Pick Method** — All / Forklift / Cart (forklift is used for large/bulky materials, determined automatically by material code prefix)
- **Order** — narrow to one specific production order

**⟳ Reload** button: refreshes data. **↓ Export Pick List** button: downloads a CSV of the current pick list to your computer, timestamped (e.g. `pick_list_20261026_1430.csv`).

**Shortage alerts**: top 5 worst shortages (by recovery time), each showing material, order, shortage quantity, and estimated days to recover.

**Component Stock Check table**: every material/order combination with Required, Available, On Order (incoming PO quantity), Shortage, Recovery days, Pick Method, Need Date, and Line. Red numbers = shortage; green = fully available.

**Pick List Preview table**: the same data reordered for picking (grouped by pick method, then order, then material), with a colored left border — orange for forklift items, red for shortages — so warehouse staff can spot special-handling items quickly.

---

## 5. Purchasing (`/purchasing`)

**Purpose**: prioritize follow-up calls to vendors based on which late POs are actually at risk of stopping production.

**Summary tiles**: Open POs (total), On Time, Overdue, Blocking Orders (POs that are both late and tied to a material currently short for a production order).

**Filters**:
- **Show** — All Open POs / Blocking Orders Only / Overdue Only
- **Vendor** — narrow to one vendor
- **Purch Group** — narrow to one purchasing group

**⟳ Reload** button: refreshes data.

**Escalation alerts**: 🔴 red alerts for POs that are late *and* blocking a production order (shows how overdue, vendor, and which order's start date is at risk); ⚡ orange alerts for POs that are simply late but not currently blocking anything.

**Open PO Escalation List table**: PO Number, Item, Material, Description, Qty, UoM, Delivery Due, Days Late, Unit Price, Currency, Vendor, Vendor Name, Purch Group, Blocks Order (⚠ YES or —), Impact Score, Earliest Order Need. The list is sorted so the POs most likely to stop production (blocking, then highest impact score = days late × quantity) appear at the top.

---

## Typical workflows

**Morning check-in**: Open Dashboard → scan Active Alerts and KPI tiles → check Bottleneck Analysis for material issues → check Semi Scheduling reminders for anything due today/tomorrow.

**Planning a line's next builds**: Go to Ops Floor → filter to your line → review the Next Build List sorted by Days Left → cross-check any red/orange rows against Materials & Pick for shortages.

**Preparing a warehouse pick**: Go to Materials & Pick → filter Show = "All Components" or narrow to a specific Order → review the Pick List Preview → click Export Pick List to get a CSV for the floor.

**Chasing a late vendor**: Go to Purchasing → filter Show = "Blocking Orders Only" → work down the list by Impact Score, starting with anything marked "⚠ YES" under Blocks Order.

**Checking "what if we slip this order"**: Go to Gantt Chart → click the order's bar → adjust Mount Start / Completion End → Save Changes to see the visual impact in your session (remember: this doesn't change real data — use Reset to SAP to undo).

---

## Troubleshooting & FAQ

**A page says "No data" or shows empty tables.**
The underlying CSV file is missing, empty, or hasn't been exported yet. Contact whoever manages the SAP/EOP export job. This is expected behavior — the app is designed not to crash when data is missing.

**I clicked Reload and nothing changed.**
The app re-reads the CSV files directly from disk. If the file on the server hasn't actually been updated since your last reload, the numbers will look the same. Confirm with your data/export team that a new export has landed.

**My Gantt date edit disappeared.**
Session-only edits are stored in your browser and are cleared when you close the tab/browser or clear site data. They were never saved to SAP or the CSVs — this is by design, to let you experiment without affecting real schedules.

**Why does one order show red when materials look available?**
Status also factors in whether the order is overdue regardless of stock. Check both the Gantt tooltip and the Materials & Pick page for that order's specific components.

**Can I edit stock levels, quantities, or vendor info directly in the app?**
No. All of that data is read-only and comes from the CSV exports — the only "edit" capability is the session-local Gantt date override described above.

**Is this connected live to SAP?**
No. It reads flat CSV files that are periodically exported from SAP (and a custom EOP milestone system) by a separate process outside this app. There is no live SAP connection.

**Who can access this dashboard?**
There's no login — access is controlled by network location (internal network or VPN only). Don't share the URL outside your organization.
