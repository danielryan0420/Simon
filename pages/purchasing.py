"""
pages/purchasing.py - Purchasing escalation page.
Late / at-risk PO lines sorted by delay impact on production.
"""

import pandas as pd
from dash import dcc, html, dash_table, Input, Output, callback

import data_loader as dl

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

COMMON_TABLE_STYLE = dict(
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
)


def _build_esc_display(df: pd.DataFrame) -> pd.DataFrame:
    rename = {
        "EBELN": "PO Number",
        "EBELP": "Item",
        "MATNR": "Material",
        "MAKTX": "Description",
        "MENGE": "Qty",
        "MEINS": "UoM",
        "EINDT": "Delivery Due",
        "days_late": "Days Late",
        "NETPR": "Unit Price",
        "WAERS": "Curr",
        "LIFNR": "Vendor",
        "NAME1": "Vendor Name",
        "EKGRP": "Purch Grp",
        "blocks_order": "Blocks Order",
        "impact_score": "Impact Score",
        "earliest_order_start": "Earliest Order Need",
    }
    cols = [c for c in rename if c in df.columns]
    out = df[cols].copy().rename(columns={c: rename[c] for c in cols})

    if "Delivery Due" in out.columns:
        out["Delivery Due"] = pd.to_datetime(out["Delivery Due"], errors="coerce").dt.strftime("%d %b %Y")
    if "Earliest Order Need" in out.columns:
        out["Earliest Order Need"] = pd.to_datetime(out["Earliest Order Need"], errors="coerce").dt.strftime("%d %b %Y")
    if "Blocks Order" in out.columns:
        out["Blocks Order"] = out["Blocks Order"].map({True: "⚠ YES", False: "—"})
    if "Days Late" in out.columns:
        out["Days Late"] = out["Days Late"].fillna(0).astype(int)
    if "Impact Score" in out.columns:
        out["Impact Score"] = out["Impact Score"].fillna(0).astype(int)
    if "Unit Price" in out.columns:
        out["Unit Price"] = out["Unit Price"].apply(lambda x: f"{float(x):,.2f}" if pd.notna(x) else "")

    return out


# ─────────────────────────────────────────────────────────────────────────────
# Layout
# ─────────────────────────────────────────────────────────────────────────────

def layout():
    return html.Div([
        html.Div([
            html.Div([
                html.H1("Purchasing Escalation"),
                html.P("Late POs prioritised by delay impact on production orders"),
            ]),
            html.Button("⟳ Reload", id="pur-reload-btn", className="btn btn-outline"),
        ], className="page-header"),

        # Summary tiles
        html.Div(id="pur-summary-tiles", className="stat-grid"),

        # Filters
        html.Div([
            html.Div([
                html.Label("Show"),
                dcc.Dropdown(
                    id="pur-filter-show",
                    options=[
                        {"label": "All Open POs", "value": "ALL"},
                        {"label": "Blocking Orders Only", "value": "BLOCKING"},
                        {"label": "Overdue Only", "value": "LATE"},
                    ],
                    value="ALL",
                    clearable=False,
                    style={"width": "200px", "fontSize": "13px"},
                ),
            ], className="filter-group"),
            html.Div([
                html.Label("Vendor"),
                dcc.Dropdown(
                    id="pur-filter-vendor",
                    options=[],
                    value=None,
                    placeholder="All vendors",
                    style={"width": "200px", "fontSize": "13px"},
                ),
            ], className="filter-group"),
            html.Div([
                html.Label("Purch Group"),
                dcc.Dropdown(
                    id="pur-filter-grp",
                    options=[],
                    value=None,
                    placeholder="All groups",
                    style={"width": "140px", "fontSize": "13px"},
                ),
            ], className="filter-group"),
        ], className="filter-row"),

        # Escalation alerts
        html.Div(id="pur-alerts"),

        # Escalation table
        html.Div([
            html.Div("Open PO Escalation List", className="card-title"),
            html.Div(id="pur-table-container"),
        ], className="card"),
    ])


# ─────────────────────────────────────────────────────────────────────────────
# Callbacks
# ─────────────────────────────────────────────────────────────────────────────

def register_callbacks(app):

    @app.callback(
        Output("pur-filter-vendor", "options"),
        Output("pur-filter-grp", "options"),
        Input("pur-reload-btn", "n_clicks"),
        prevent_initial_call=False,
    )
    def populate_filters(_):
        df = dl.build_purchasing_escalation()
        if df.empty:
            return [], []
        vendors = sorted(df["NAME1"].dropna().unique().tolist()) if "NAME1" in df.columns else []
        grps = sorted(df["EKGRP"].dropna().unique().tolist()) if "EKGRP" in df.columns else []
        return (
            [{"label": v, "value": v} for v in vendors],
            [{"label": g, "value": g} for g in grps],
        )

    @app.callback(
        Output("pur-summary-tiles", "children"),
        Output("pur-alerts", "children"),
        Output("pur-table-container", "children"),
        Input("pur-reload-btn", "n_clicks"),
        Input("pur-filter-show", "value"),
        Input("pur-filter-vendor", "value"),
        Input("pur-filter-grp", "value"),
    )
    def update_purchasing(reload_n, show, vendor, grp):
        df = dl.build_purchasing_escalation()

        if df.empty:
            empty = html.P("No purchasing data. Check ekpo_open_po.csv.", style={"color": "#64748b"})
            return [], [], empty

        today = pd.Timestamp.now().normalize()

        # Filters
        filtered = df.copy()
        if show == "BLOCKING":
            filtered = filtered[filtered["blocks_order"] == True]
        elif show == "LATE":
            filtered = filtered[filtered["days_late"] > 0]
        if vendor and "NAME1" in filtered.columns:
            filtered = filtered[filtered["NAME1"] == vendor]
        if grp and "EKGRP" in filtered.columns:
            filtered = filtered[filtered["EKGRP"] == grp]

        # ── Summary tiles ─────────────────────────────────────────────────────
        total = len(filtered)
        late_count = (filtered["days_late"] > 0).sum() if "days_late" in filtered.columns else 0
        blocking = filtered["blocks_order"].sum() if "blocks_order" in filtered.columns else 0
        on_time = total - late_count

        tiles = [
            html.Div([html.Div(str(total), className="stat-value"), html.Div("Open POs", className="stat-label")],
                     className="stat-tile stat-blue"),
            html.Div([html.Div(str(on_time), className="stat-value"), html.Div("On Time", className="stat-label")],
                     className="stat-tile stat-green"),
            html.Div([html.Div(str(late_count), className="stat-value"), html.Div("Overdue", className="stat-label")],
                     className="stat-tile stat-orange"),
            html.Div([html.Div(str(blocking), className="stat-value"), html.Div("Blocking Orders", className="stat-label")],
                     className="stat-tile stat-red"),
        ]

        # ── Alerts ────────────────────────────────────────────────────────────
        alerts = []
        top_blocks = filtered[filtered["blocks_order"] == True].head(5) if "blocks_order" in filtered.columns else pd.DataFrame()
        for _, r in top_blocks.iterrows():
            days = int(r.get("days_late", 0))
            alerts.append(html.Div([
                html.Span("⚠ "),
                html.Strong(f"PO {r.get('EBELN', '?')} – {r.get('MAKTX', '')}"),
                html.Span(
                    f"  Overdue {days}d | Vendor: {r.get('NAME1', '-')} | Blocks order from {str(r.get('earliest_order_start', '-'))[:10]}",
                    style={"fontSize": "12px"}
                ),
            ], className="alert alert-red", style={"marginBottom": "6px"}))

        top_late = filtered[(filtered["days_late"] > 0) & (~filtered["blocks_order"])].head(3) if "blocks_order" in filtered.columns else pd.DataFrame()
        for _, r in top_late.iterrows():
            days = int(r.get("days_late", 0))
            alerts.append(html.Div([
                html.Span("⚡ "),
                html.Strong(f"PO {r.get('EBELN', '?')} – {r.get('MAKTX', '')}"),
                html.Span(f"  {days} days overdue | Vendor: {r.get('NAME1', '-')}",
                          style={"fontSize": "12px"}),
            ], className="alert alert-orange", style={"marginBottom": "6px"}))

        if not alerts:
            alerts = [html.Div("✓ No overdue or blocking POs in current filter.", className="alert alert-green")]

        # ── Table ─────────────────────────────────────────────────────────────
        df_display = _build_esc_display(filtered)

        if df_display.empty:
            table = html.P("No POs match the current filters.", style={"color": "#64748b", "fontSize": "13px"})
        else:
            table = dash_table.DataTable(
                data=df_display.to_dict("records"),
                columns=[{"name": c, "id": c} for c in df_display.columns],
                page_size=20,
                sort_action="native",
                filter_action="native",
                style_data_conditional=[
                    {"if": {"filter_query": '{Blocks Order} = "⚠ YES"'},
                     "borderLeft": "3px solid #ef4444"},
                    {"if": {"filter_query": "{Days Late} > 0", "column_id": "Days Late"},
                     "color": "#ef4444", "fontWeight": "700"},
                    {"if": {"filter_query": "{Days Late} = 0", "column_id": "Days Late"},
                     "color": "#22c55e"},
                    {"if": {"row_index": "odd"}, "backgroundColor": "#1c1f30"},
                ],
                **COMMON_TABLE_STYLE,
            )

        return tiles, alerts, table
