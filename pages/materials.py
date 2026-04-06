"""
pages/materials.py - Materials / Pick page.
Shows RESB needs vs stock + incoming, classifies pick method,
and generates printable pick lists.
"""

import io
import base64
import pandas as pd
from dash import dcc, html, dash_table, Input, Output, State, callback
from dash.exceptions import PreventUpdate

import data_loader as dl

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

SHORTAGE_STYLE = [
    {
        "if": {"filter_query": "{Shortage} > 0", "column_id": "Shortage"},
        "color": "#ef4444",
        "fontWeight": "700",
    },
    {
        "if": {"filter_query": "{Shortage} = 0", "column_id": "Shortage"},
        "color": "#22c55e",
    },
    {
        "if": {"filter_query": "{Pick Method} = FORKLIFT", "column_id": "Pick Method"},
        "color": "#f97316",
        "fontWeight": "600",
    },
    {"if": {"row_index": "odd"}, "backgroundColor": "#1c1f30"},
]

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


def _build_display_df(mat: pd.DataFrame) -> pd.DataFrame:
    rename = {
        "AUFNR": "Order",
        "MATNR": "Material",
        "MAKTX": "Description",
        "BDMNG": "Required",
        "MEINS": "UoM",
        "available": "Available",
        "po_qty": "On Order",
        "shortage_qty": "Shortage",
        "recovery_days": "Recovery d",
        "PICK_TYPE": "Pick Method",
        "BDTER": "Need Date",
        "LINE": "Line",
    }
    cols = [c for c in rename if c in mat.columns]
    df = mat[cols].copy().rename(columns={c: rename[c] for c in cols})

    if "Need Date" in df.columns:
        df["Need Date"] = pd.to_datetime(df["Need Date"], errors="coerce").dt.strftime("%d %b %Y")

    for num_col in ("Required", "Available", "On Order", "Shortage"):
        if num_col in df.columns:
            df[num_col] = df[num_col].fillna(0).apply(lambda x: f"{int(x):,}")

    return df


def _generate_pick_csv(mat: pd.DataFrame) -> str:
    pick = mat[mat["is_short"] | (mat["shortage_qty"] == 0)].copy()
    pick = pick[["AUFNR", "MATNR", "MAKTX", "BDMNG", "MEINS", "available", "shortage_qty",
                 "PICK_TYPE", "BDTER", "LINE"]].copy()
    pick.columns = ["Order", "Material", "Description", "Required", "UoM",
                    "Available", "Shortage", "Pick Method", "Need Date", "Line"]
    return pick.to_csv(index=False)


# ─────────────────────────────────────────────────────────────────────────────
# Layout
# ─────────────────────────────────────────────────────────────────────────────

def layout():
    return html.Div([
        html.Div([
            html.Div([
                html.H1("Materials & Pick"),
                html.P("RESB requirements vs. unrestricted stock + incoming — pick list generator"),
            ]),
            html.Div([
                html.Button("⟳ Reload", id="mat-reload-btn", className="btn btn-outline"),
                html.Button("↓ Export Pick List", id="mat-export-btn", className="btn btn-success",
                            style={"marginLeft": "8px"}),
                dcc.Download(id="mat-download"),
            ], style={"display": "flex", "alignItems": "center"}),
        ], className="page-header"),

        # Summary tiles
        html.Div(id="mat-summary-tiles", className="stat-grid"),

        # Filters
        html.Div([
            html.Div([
                html.Label("Show"),
                dcc.Dropdown(
                    id="mat-show-filter",
                    options=[
                        {"label": "All Components", "value": "ALL"},
                        {"label": "Shortages Only", "value": "SHORT"},
                        {"label": "Available Only", "value": "OK"},
                    ],
                    value="ALL",
                    clearable=False,
                    style={"width": "180px", "fontSize": "13px"},
                ),
            ], className="filter-group"),
            html.Div([
                html.Label("Pick Method"),
                dcc.Dropdown(
                    id="mat-pick-filter",
                    options=[
                        {"label": "All", "value": "ALL"},
                        {"label": "Forklift", "value": "FORKLIFT"},
                        {"label": "Cart", "value": "CART"},
                    ],
                    value="ALL",
                    clearable=False,
                    style={"width": "140px", "fontSize": "13px"},
                ),
            ], className="filter-group"),
            html.Div([
                html.Label("Order"),
                dcc.Dropdown(
                    id="mat-order-filter",
                    options=[],
                    value=None,
                    placeholder="All orders",
                    style={"width": "180px", "fontSize": "13px"},
                ),
            ], className="filter-group"),
        ], className="filter-row"),

        # Shortage alerts
        html.Div(id="mat-alerts"),

        # Main table
        html.Div([
            html.Div("Component Stock Check", className="card-title"),
            html.Div(id="mat-table-container"),
        ], className="card"),

        # Pick list preview
        html.Div([
            html.Div("Pick List Preview (shortages highlighted)", className="card-title"),
            html.Div(id="mat-picklist-container"),
        ], className="card"),
    ])


# ─────────────────────────────────────────────────────────────────────────────
# Callbacks
# ─────────────────────────────────────────────────────────────────────────────

def register_callbacks(app):

    @app.callback(
        Output("mat-order-filter", "options"),
        Input("mat-reload-btn", "n_clicks"),
        prevent_initial_call=False,
    )
    def populate_order_filter(_):
        mat = dl.merge_materials()
        if mat.empty:
            return []
        orders = sorted(mat["AUFNR"].dropna().unique().tolist())
        return [{"label": o, "value": o} for o in orders]

    @app.callback(
        Output("mat-summary-tiles", "children"),
        Output("mat-alerts", "children"),
        Output("mat-table-container", "children"),
        Output("mat-picklist-container", "children"),
        Input("mat-reload-btn", "n_clicks"),
        Input("mat-show-filter", "value"),
        Input("mat-pick-filter", "value"),
        Input("mat-order-filter", "value"),
    )
    def update_materials(reload_n, show, pick_method, order):
        mat = dl.merge_materials()

        if mat.empty:
            empty = html.P("No material data. Check resb.csv, mard.csv.", style={"color": "#64748b"})
            return [], [], empty, empty

        # Filters
        filtered = mat.copy()
        if show == "SHORT":
            filtered = filtered[filtered["is_short"]]
        elif show == "OK":
            filtered = filtered[~filtered["is_short"]]
        if pick_method != "ALL":
            filtered = filtered[filtered["PICK_TYPE"] == pick_method]
        if order:
            filtered = filtered[filtered["AUFNR"] == order]

        # ── Summary tiles ─────────────────────────────────────────────────────
        total = len(filtered)
        short_count = filtered["is_short"].sum()
        ok_count = total - short_count
        forklift = (filtered["PICK_TYPE"] == "FORKLIFT").sum()

        tiles = [
            html.Div([html.Div(str(total), className="stat-value"), html.Div("Components", className="stat-label")],
                     className="stat-tile stat-blue"),
            html.Div([html.Div(str(ok_count), className="stat-value"), html.Div("Available", className="stat-label")],
                     className="stat-tile stat-green"),
            html.Div([html.Div(str(short_count), className="stat-value"), html.Div("Shortages", className="stat-label")],
                     className="stat-tile stat-red"),
            html.Div([html.Div(str(forklift), className="stat-value"), html.Div("Forklift Picks", className="stat-label")],
                     className="stat-tile stat-orange"),
        ]

        # ── Shortage alerts ───────────────────────────────────────────────────
        alerts = []
        short_rows = mat[mat["is_short"]].sort_values("recovery_days", ascending=False).head(5)
        for _, r in short_rows.iterrows():
            alerts.append(html.Div([
                html.Span("⚠ "),
                html.Strong(f"{r['MATNR']} – {r.get('MAKTX', '')}"),
                html.Span(f"  Short: {int(r['shortage_qty'])} {r.get('MEINS', 'EA')} "
                          f"| Recovery: ~{int(r['recovery_days'])} days "
                          f"| Order: {r['AUFNR']}",
                          style={"fontSize": "12px"}),
            ], className="alert alert-red", style={"marginBottom": "6px"}))

        if not alerts:
            alerts = [html.Div("✓ No shortages detected for current filter.", className="alert alert-green")]

        # ── Main table ────────────────────────────────────────────────────────
        df_display = _build_display_df(filtered)

        if df_display.empty:
            table = html.P("No components match the current filters.", style={"color": "#64748b", "fontSize": "13px"})
        else:
            table = dash_table.DataTable(
                data=df_display.to_dict("records"),
                columns=[{"name": c, "id": c} for c in df_display.columns],
                page_size=25,
                sort_action="native",
                filter_action="native",
                style_data_conditional=SHORTAGE_STYLE,
                **COMMON_TABLE_STYLE,
            )

        # ── Pick list ─────────────────────────────────────────────────────────
        pick_df = filtered.copy()
        pick_df = pick_df.sort_values(["PICK_TYPE", "AUFNR", "MATNR"])
        pick_display = _build_display_df(pick_df)

        if pick_display.empty:
            picklist = html.P("No pick items.", style={"color": "#64748b", "fontSize": "13px"})
        else:
            picklist = dash_table.DataTable(
                data=pick_display.to_dict("records"),
                columns=[{"name": c, "id": c} for c in pick_display.columns],
                page_size=30,
                sort_action="native",
                style_data_conditional=[
                    {"if": {"filter_query": '{Pick Method} = FORKLIFT'},
                     "borderLeft": "3px solid #f97316"},
                    {"if": {"filter_query": '{Shortage} > 0'},
                     "borderLeft": "3px solid #ef4444"},
                    {"if": {"row_index": "odd"}, "backgroundColor": "#1c1f30"},
                ],
                **COMMON_TABLE_STYLE,
            )

        return tiles, alerts, table, picklist

    @app.callback(
        Output("mat-download", "data"),
        Input("mat-export-btn", "n_clicks"),
        prevent_initial_call=True,
    )
    def export_pick_list(n):
        mat = dl.merge_materials()
        if mat.empty:
            raise PreventUpdate
        csv_str = _generate_pick_csv(mat)
        ts = pd.Timestamp.now().strftime("%Y%m%d_%H%M")
        return dcc.send_string(csv_str, filename=f"pick_list_{ts}.csv")
