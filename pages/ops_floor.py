"""
pages/ops_floor.py - Ops Floor view: next-build list filtered by line/station,
showing due dates and EOP progress indicators.
"""

import pandas as pd
from dash import dcc, html, dash_table, Input, Output, callback
from dash.exceptions import PreventUpdate

import data_loader as dl

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

PHASE_BADGE = {
    "MOUNT":   ("MOUNT",   "badge-blue"),
    "TEST":    ("TEST",    "badge-orange"),
    "FINAL":   ("FINAL",   "badge-green"),
    "PLANNED": ("PLANNED", "badge-grey"),
}

STATUS_DOT = {
    "green":  "🟢",
    "orange": "🟡",
    "red":    "🔴",
    "grey":   "⚫",
}


def _build_ops_table(schedule: pd.DataFrame) -> pd.DataFrame:
    if schedule.empty:
        return pd.DataFrame()

    today = pd.Timestamp.now().normalize()

    cols = {
        "AUFNR": "Order",
        "MAKTX": "Description",
        "LINE": "Line",
        "GAMNG": "Qty",
        "GMEIN": "UoM",
        "pre_start": "Mount Start",
        "post_end": "Due Date",
        "CURRENT_PHASE": "Phase",
        "PCT_COMPLETE": "% Done",
        "STATUS_COLOR": "Status",
    }

    available = [c for c in cols if c in schedule.columns]
    df = schedule[available].copy().rename(columns={c: cols[c] for c in available})

    # Format dates
    for date_col in ("Mount Start", "Due Date"):
        if date_col in df.columns:
            df[date_col] = pd.to_datetime(df[date_col], errors="coerce").dt.strftime("%d %b %Y")

    # Humanise status
    if "Status" in df.columns:
        df["Status"] = df["Status"].map(lambda s: STATUS_DOT.get(s, "⚫") + " " + (s or "").capitalize())

    # Days until due
    if "Due Date" in schedule.columns:
        due = pd.to_datetime(schedule.get("post_end"), errors="coerce")
        df["Days Left"] = (due - today).dt.days.fillna(0).astype(int)
    else:
        df["Days Left"] = 0

    if "% Done" in df.columns:
        df["% Done"] = df["% Done"].fillna(0).astype(int).astype(str) + " %"

    # Sort: soonest due first
    df = df.sort_values("Days Left", ascending=True)

    return df


# ─────────────────────────────────────────────────────────────────────────────
# Layout
# ─────────────────────────────────────────────────────────────────────────────

def layout():
    schedule = dl.build_schedule()
    lines = sorted(schedule["LINE"].dropna().unique().tolist()) if not schedule.empty else []

    return html.Div([
        html.Div([
            html.Div([
                html.H1("Ops Floor"),
                html.P("Next builds by line — due dates and EOP progress at a glance"),
            ]),
            html.Button("⟳ Reload", id="ops-reload-btn", className="btn btn-outline"),
        ], className="page-header"),

        # Filters
        html.Div([
            html.Div([
                html.Label("Production Line"),
                dcc.Dropdown(
                    id="ops-line-filter",
                    options=[{"label": "All Lines", "value": "ALL"}]
                           + [{"label": l, "value": l} for l in lines],
                    value="ALL",
                    clearable=False,
                    style={"width": "160px", "fontSize": "13px"},
                ),
            ], className="filter-group"),
            html.Div([
                html.Label("Status"),
                dcc.Dropdown(
                    id="ops-status-filter",
                    options=[
                        {"label": "All", "value": "ALL"},
                        {"label": "🟢 On-Track", "value": "green"},
                        {"label": "🟡 Waiting", "value": "orange"},
                        {"label": "🔴 Shortage", "value": "red"},
                    ],
                    value="ALL",
                    clearable=False,
                    style={"width": "160px", "fontSize": "13px"},
                ),
            ], className="filter-group"),
            html.Div([
                html.Label("Horizon (days)"),
                dcc.Slider(
                    id="ops-horizon-slider",
                    min=7, max=90, step=7, value=30,
                    marks={7: "7d", 14: "14d", 30: "30d", 60: "60d", 90: "90d"},
                    tooltip={"always_visible": False},
                ),
            ], className="filter-group", style={"minWidth": "220px"}),
        ], className="filter-row"),

        # Progress cards (per line)
        html.Div(id="ops-line-cards", style={"marginBottom": "16px"}),

        # Build list table
        html.Div([
            html.Div("Next Build List", className="card-title"),
            html.Div(id="ops-table-container"),
        ], className="card"),
    ])


# ─────────────────────────────────────────────────────────────────────────────
# Callbacks
# ─────────────────────────────────────────────────────────────────────────────

def register_callbacks(app):

    @app.callback(
        Output("ops-line-cards", "children"),
        Output("ops-table-container", "children"),
        Input("ops-reload-btn", "n_clicks"),
        Input("ops-line-filter", "value"),
        Input("ops-status-filter", "value"),
        Input("ops-horizon-slider", "value"),
    )
    def update_ops(reload_n, line, status, horizon_days):
        schedule = dl.build_schedule()

        if schedule.empty:
            empty = html.P("No orders found. Check your CSV files.", style={"color": "#64748b"})
            return [], empty

        today = pd.Timestamp.now().normalize()
        cutoff = today + pd.Timedelta(days=horizon_days)

        # Horizon filter
        due_col = schedule.get("post_end") if "post_end" in schedule.columns else schedule.get("GLTRP")
        if due_col is not None:
            schedule = schedule[pd.to_datetime(schedule["post_end" if "post_end" in schedule.columns else "GLTRP"],
                                               errors="coerce") <= cutoff]

        # Line filter
        if line != "ALL":
            schedule = schedule[schedule["LINE"] == line]

        # Status filter
        if status != "ALL":
            schedule = schedule[schedule["STATUS_COLOR"] == status]

        # ── Line summary cards ────────────────────────────────────────────────
        cards = []
        for ln in sorted(schedule["LINE"].dropna().unique()):
            ln_df = schedule[schedule["LINE"] == ln]
            total = len(ln_df)
            on_track = (ln_df["STATUS_COLOR"] == "green").sum()
            warning = (ln_df["STATUS_COLOR"] == "orange").sum()
            critical = (ln_df["STATUS_COLOR"] == "red").sum()
            avg_pct = int(ln_df["PCT_COMPLETE"].fillna(0).mean()) if "PCT_COMPLETE" in ln_df else 0

            cards.append(html.Div([
                html.Div(ln, style={"fontWeight": "700", "fontSize": "14px", "marginBottom": "8px", "color": "#818cf8"}),
                html.Div([
                    html.Div([html.Div(str(total), className="stat-value"), html.Div("Orders", className="stat-label")],
                             className="stat-tile stat-blue", style={"padding": "10px 12px"}),
                    html.Div([html.Div(str(on_track), className="stat-value"), html.Div("On-Track", className="stat-label")],
                             className="stat-tile stat-green", style={"padding": "10px 12px"}),
                    html.Div([html.Div(str(warning), className="stat-value"), html.Div("Waiting", className="stat-label")],
                             className="stat-tile stat-orange", style={"padding": "10px 12px"}),
                    html.Div([html.Div(str(critical), className="stat-value"), html.Div("Critical", className="stat-label")],
                             className="stat-tile stat-red", style={"padding": "10px 12px"}),
                    html.Div([html.Div(f"{avg_pct}%", className="stat-value"), html.Div("Avg Done", className="stat-label")],
                             className="stat-tile", style={"padding": "10px 12px"}),
                ], style={"display": "grid", "gridTemplateColumns": "repeat(5,1fr)", "gap": "8px"}),
            ], className="card", style={"marginBottom": "10px"}))

        # ── Build list table ──────────────────────────────────────────────────
        df = _build_ops_table(schedule)

        if df.empty:
            table = html.P("No orders match the current filters.", style={"color": "#64748b", "fontSize": "13px"})
        else:
            table = dash_table.DataTable(
                data=df.to_dict("records"),
                columns=[{"name": c, "id": c} for c in df.columns],
                page_size=20,
                sort_action="native",
                filter_action="native",
                style_table={"overflowX": "auto"},
                style_header={
                    "backgroundColor": "#1e2235",
                    "color": "#94a3b8",
                    "fontWeight": "600",
                    "fontSize": "11px",
                    "textTransform": "uppercase",
                    "letterSpacing": "0.5px",
                    "border": "none",
                    "borderBottom": "1px solid #2d3148",
                },
                style_data={
                    "backgroundColor": "#1a1d27",
                    "color": "#e2e8f0",
                    "fontSize": "13px",
                    "border": "none",
                    "borderBottom": "1px solid #232638",
                },
                style_data_conditional=[
                    {"if": {"filter_query": '{Days Left} < 3', "column_id": "Days Left"},
                     "color": "#ef4444", "fontWeight": "700"},
                    {"if": {"filter_query": '{Days Left} >= 3 && {Days Left} < 7', "column_id": "Days Left"},
                     "color": "#f97316"},
                    {"if": {"filter_query": '{Days Left} >= 7', "column_id": "Days Left"},
                     "color": "#22c55e"},
                    {"if": {"row_index": "odd"}, "backgroundColor": "#1c1f30"},
                ],
                style_filter={
                    "backgroundColor": "#0f1117",
                    "color": "#e2e8f0",
                    "border": "1px solid #2d3148",
                },
            )

        return cards, table
