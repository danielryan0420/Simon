"""
pages/gantt.py - Gantt chart page with pre/post-test bars,
status colours, filters, and drag-to-reschedule.
"""

import json
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from dash import dcc, html, Input, Output, State, callback, ctx, no_update
from dash.exceptions import PreventUpdate

import data_loader as dl

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

COLOR_MAP = {
    "green":  "#22c55e",
    "orange": "#f97316",
    "red":    "#ef4444",
    "grey":   "#475569",
}

PHASE_COLOR = {
    "Pre-Test":  "#60a5fa",
    "Post-Test": "#a78bfa",
}


def _build_gantt_rows(schedule: pd.DataFrame) -> pd.DataFrame:
    """Explode each order into pre-test and post-test rows for px.timeline."""
    rows = []
    shortage_map = {}

    # Attach shortage info
    try:
        mat = dl.merge_materials()
        if not mat.empty:
            short = mat[mat["is_short"]].groupby("AUFNR").agg(
                short_qty=("shortage_qty", "sum"),
                recovery=("recovery_days", "max"),
            )
            shortage_map = short.to_dict("index")
    except Exception:
        pass

    for _, row in schedule.iterrows():
        aufnr = str(row["AUFNR"])
        label = f"{aufnr} | {row.get('MAKTX', '')}"
        color = COLOR_MAP.get(row.get("STATUS_COLOR", "grey"), "#475569")
        sinfo = shortage_map.get(aufnr, {})
        short_qty = sinfo.get("short_qty", 0)
        recovery = sinfo.get("recovery", 0)

        hover = (
            f"<b>{label}</b><br>"
            f"Line: {row.get('LINE', '-')}<br>"
            f"Qty: {row.get('GAMNG', '-')} {row.get('GMEIN', '')}<br>"
            f"Phase: {{phase}}<br>"
            f"EOP: {row.get('CURRENT_PHASE', '-')} ({int(row.get('PCT_COMPLETE', 0))}%)"
        )
        if short_qty:
            hover += f"<br><span style='color:#ef4444'>⚠ Short: {int(short_qty)} | Recovery: {int(recovery)}d</span>"

        pre_s = row.get("pre_start")
        pre_e = row.get("pre_end")
        post_s = row.get("post_start")
        post_e = row.get("post_end")

        if pd.notna(pre_s) and pd.notna(pre_e) and pre_e > pre_s:
            rows.append({
                "Task": label,
                "AUFNR": aufnr,
                "Line": row.get("LINE", "?"),
                "Phase": "Pre-Test",
                "Start": pre_s,
                "Finish": pre_e,
                "Color": PHASE_COLOR["Pre-Test"],
                "StatusColor": color,
                "HoverText": hover.format(phase="Pre-Test"),
                "EOP_Phase": row.get("CURRENT_PHASE", ""),
                "PCT": int(row.get("PCT_COMPLETE", 0)),
                "Short": bool(short_qty),
            })

        if pd.notna(post_s) and pd.notna(post_e) and post_e > post_s:
            rows.append({
                "Task": label,
                "AUFNR": aufnr,
                "Line": row.get("LINE", "?"),
                "Phase": "Post-Test",
                "Start": post_s,
                "Finish": post_e,
                "Color": PHASE_COLOR["Post-Test"] if not short_qty else COLOR_MAP["red"],
                "StatusColor": color,
                "HoverText": hover.format(phase="Post-Test"),
                "EOP_Phase": row.get("CURRENT_PHASE", ""),
                "PCT": int(row.get("PCT_COMPLETE", 0)),
                "Short": bool(short_qty),
            })

    return pd.DataFrame(rows) if rows else pd.DataFrame()


def _build_figure(df_rows: pd.DataFrame, group_by: str = "Line") -> go.Figure:
    if df_rows.empty:
        fig = go.Figure()
        fig.update_layout(
            paper_bgcolor="#1a1d27",
            plot_bgcolor="#1a1d27",
            font=dict(color="#94a3b8"),
        )
        return fig

    y_col = group_by if group_by in df_rows.columns else "Task"

    fig = px.timeline(
        df_rows,
        x_start="Start",
        x_end="Finish",
        y=y_col,
        color="Phase",
        color_discrete_map=PHASE_COLOR,
        hover_name="Task",
        custom_data=["AUFNR", "Phase", "EOP_Phase", "PCT", "Short", "HoverText"],
        labels={"Phase": "Build Phase"},
    )

    # Override with status-aware colours via marker line
    for trace in fig.data:
        phase = trace.name
        bar_color = PHASE_COLOR.get(phase, "#60a5fa")
        trace.marker.color = bar_color
        trace.marker.line.width = 0

    # Today line
    today = pd.Timestamp.now()
    fig.add_vline(
        x=today.timestamp() * 1000,
        line_dash="dash",
        line_color="#f97316",
        line_width=1.5,
        annotation_text="Today",
        annotation_font_color="#f97316",
        annotation_font_size=11,
    )

    fig.update_layout(
        paper_bgcolor="#1a1d27",
        plot_bgcolor="#1a1d27",
        font=dict(color="#e2e8f0", size=12),
        xaxis=dict(
            showgrid=True,
            gridcolor="#2d3148",
            tickformat="%b %d",
            tickfont=dict(size=11, color="#94a3b8"),
            rangeslider=dict(visible=True, bgcolor="#0f1117", thickness=0.04),
        ),
        yaxis=dict(
            showgrid=False,
            tickfont=dict(size=11, color="#94a3b8"),
            autorange="reversed",
        ),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="left",
            x=0,
            font=dict(size=11, color="#94a3b8"),
            bgcolor="rgba(0,0,0,0)",
        ),
        margin=dict(l=8, r=8, t=40, b=8),
        height=520,
        hovermode="closest",
        dragmode="pan",
        hoverlabel=dict(bgcolor="#1e2235", font_color="#e2e8f0", font_size=12),
    )

    fig.update_traces(
        hovertemplate="%{customdata[5]}<extra></extra>",
    )

    return fig


# ─────────────────────────────────────────────────────────────────────────────
# Layout
# ─────────────────────────────────────────────────────────────────────────────

def layout():
    schedule = dl.build_schedule()
    lines = sorted(schedule["LINE"].dropna().unique().tolist()) if not schedule.empty else []
    statuses = ["All", "green", "orange", "red"]

    return html.Div([
        # Header
        html.Div([
            html.Div([
                html.H1("Production Gantt"),
                html.P("Pre/Post-test timeline · drag bars to reschedule · EOP-linked colours"),
            ]),
            html.Div([
                html.Button("⟳ Reload CSVs", id="gantt-reload-btn", className="btn btn-outline"),
                html.Span("", id="gantt-reload-status", className="", style={"fontSize": "11px", "color": "#64748b", "marginLeft": "8px"}),
            ], style={"display": "flex", "alignItems": "center"}),
        ], className="page-header"),

        # Filters
        html.Div([
            html.Div([
                html.Label("Production Line"),
                dcc.Dropdown(
                    id="gantt-line-filter",
                    options=[{"label": "All Lines", "value": "ALL"}] + [{"label": l, "value": l} for l in lines],
                    value="ALL",
                    clearable=False,
                    style={"width": "160px", "fontSize": "13px"},
                ),
            ], className="filter-group"),
            html.Div([
                html.Label("Status"),
                dcc.Dropdown(
                    id="gantt-status-filter",
                    options=[{"label": s.capitalize(), "value": s} for s in statuses],
                    value="All",
                    clearable=False,
                    style={"width": "130px", "fontSize": "13px"},
                ),
            ], className="filter-group"),
            html.Div([
                html.Label("Group By"),
                dcc.Dropdown(
                    id="gantt-groupby",
                    options=[
                        {"label": "Line", "value": "Line"},
                        {"label": "Order", "value": "Task"},
                    ],
                    value="Line",
                    clearable=False,
                    style={"width": "120px", "fontSize": "13px"},
                ),
            ], className="filter-group"),
            html.Div([
                html.Label("Date Range"),
                dcc.DatePickerRange(
                    id="gantt-date-range",
                    start_date=pd.Timestamp.now().date(),
                    end_date=(pd.Timestamp.now() + pd.Timedelta(days=30)).date(),
                    display_format="MMM DD",
                    style={"fontSize": "13px"},
                ),
            ], className="filter-group"),
        ], className="filter-row"),

        # Legend
        html.Div([
            html.Span("● On-Track", style={"color": "#22c55e", "fontSize": "12px", "marginRight": "14px"}),
            html.Span("● Waiting / Delayed", style={"color": "#f97316", "fontSize": "12px", "marginRight": "14px"}),
            html.Span("● Shortage / Critical", style={"color": "#ef4444", "fontSize": "12px", "marginRight": "14px"}),
            html.Span("│ Today", style={"color": "#f97316", "fontSize": "12px", "borderLeft": "2px dashed #f97316", "paddingLeft": "6px"}),
        ], style={"marginBottom": "10px"}),

        # Gantt chart
        html.Div([
            dcc.Graph(
                id="gantt-chart",
                config={
                    "displayModeBar": True,
                    "modeBarButtonsToRemove": ["autoScale2d", "lasso2d", "select2d"],
                    "scrollZoom": True,
                    "toImageButtonOptions": {"format": "png", "filename": "gantt_schedule"},
                },
                style={"height": "540px"},
            ),
        ], id="gantt-container"),

        # Edit panel (shown on bar click)
        html.Div([
            html.Div([
                html.Div("Click a bar to edit dates", className="card-title"),
                html.Div(id="gantt-edit-form"),
            ], className="card", style={"marginTop": "16px"}),
        ], id="gantt-edit-panel", style={"display": "none"}),

        # Hidden store for schedule overrides (session-local)
        dcc.Store(id="schedule-overrides", storage_type="session", data={}),
        dcc.Store(id="gantt-schedule-store", storage_type="memory"),
    ])


# ─────────────────────────────────────────────────────────────────────────────
# Callbacks
# ─────────────────────────────────────────────────────────────────────────────

def register_callbacks(app):

    @app.callback(
        Output("gantt-schedule-store", "data"),
        Output("gantt-reload-status", "children"),
        Input("gantt-reload-btn", "n_clicks"),
        prevent_initial_call=False,
    )
    def reload_schedule(n):
        schedule = dl.build_schedule()
        ts = pd.Timestamp.now().strftime("%H:%M:%S")
        return schedule.to_json(date_format="iso"), f"Updated {ts}"

    @app.callback(
        Output("gantt-chart", "figure"),
        Input("gantt-schedule-store", "data"),
        Input("gantt-line-filter", "value"),
        Input("gantt-status-filter", "value"),
        Input("gantt-groupby", "value"),
        Input("gantt-date-range", "start_date"),
        Input("gantt-date-range", "end_date"),
        Input("schedule-overrides", "data"),
    )
    def update_gantt(store_json, line, status, group_by, start_date, end_date, overrides):
        if store_json:
            schedule = pd.read_json(store_json)
            # Re-parse datetime columns
            for col in ("GSTRS", "GLTRP", "MOUNT_TS", "TEST_TS", "FINAL_TS",
                        "pre_start", "pre_end", "post_start", "post_end"):
                if col in schedule.columns:
                    schedule[col] = pd.to_datetime(schedule[col], errors="coerce")
        else:
            schedule = dl.build_schedule()

        if schedule.empty:
            return _build_figure(pd.DataFrame())

        # Apply overrides (drag-to-reschedule)
        if overrides:
            for aufnr, dates in overrides.items():
                mask = schedule["AUFNR"] == aufnr
                if "pre_start" in dates:
                    schedule.loc[mask, "pre_start"] = pd.to_datetime(dates["pre_start"])
                if "post_end" in dates:
                    schedule.loc[mask, "post_end"] = pd.to_datetime(dates["post_end"])

        # Filters
        if line and line != "ALL":
            schedule = schedule[schedule["LINE"] == line]
        if status and status != "All":
            schedule = schedule[schedule["STATUS_COLOR"] == status]
        if start_date and end_date:
            sd = pd.to_datetime(start_date)
            ed = pd.to_datetime(end_date)
            schedule = schedule[
                (schedule["pre_start"] <= ed) & (schedule["post_end"] >= sd)
            ]

        rows = _build_gantt_rows(schedule)
        return _build_figure(rows, group_by=group_by or "Line")

    @app.callback(
        Output("gantt-edit-panel", "style"),
        Output("gantt-edit-form", "children"),
        Input("gantt-chart", "clickData"),
        State("schedule-overrides", "data"),
    )
    def show_edit_panel(click_data, overrides):
        if not click_data:
            raise PreventUpdate

        pt = click_data["points"][0]
        aufnr = pt.get("customdata", [None])[0]
        if not aufnr:
            raise PreventUpdate

        schedule = dl.build_schedule()
        row = schedule[schedule["AUFNR"] == aufnr]
        if row.empty:
            raise PreventUpdate
        row = row.iloc[0]

        ov = overrides or {}
        order_ov = ov.get(aufnr, {})

        pre_s = order_ov.get("pre_start") or (row["pre_start"].date().isoformat() if pd.notna(row["pre_start"]) else "")
        post_e = order_ov.get("post_end") or (row["post_end"].date().isoformat() if pd.notna(row["post_end"]) else "")

        form = html.Div([
            html.Div([
                html.Strong(f"Order {aufnr} — {row.get('MAKTX', '')}"),
                html.Span(f" | Line: {row.get('LINE', '-')} | Qty: {row.get('GAMNG', '-')}",
                          style={"color": "#64748b", "fontSize": "12px"}),
            ], style={"marginBottom": "12px"}),
            html.Div([
                html.Div([
                    html.Label("Mount Start", style={"fontSize": "11px", "color": "#64748b", "display": "block", "marginBottom": "4px"}),
                    dcc.Input(id="edit-pre-start", type="date", value=pre_s,
                              style={"background": "#0f1117", "color": "#e2e8f0",
                                     "border": "1px solid #2d3148", "borderRadius": "4px",
                                     "padding": "6px 10px", "fontSize": "13px"}),
                ], style={"marginRight": "20px"}),
                html.Div([
                    html.Label("Completion End", style={"fontSize": "11px", "color": "#64748b", "display": "block", "marginBottom": "4px"}),
                    dcc.Input(id="edit-post-end", type="date", value=post_e,
                              style={"background": "#0f1117", "color": "#e2e8f0",
                                     "border": "1px solid #2d3148", "borderRadius": "4px",
                                     "padding": "6px 10px", "fontSize": "13px"}),
                ]),
            ], style={"display": "flex", "marginBottom": "12px"}),
            html.Div([
                html.Button("Save Changes", id="edit-save-btn", className="btn btn-primary",
                            **{"data-aufnr": aufnr}),
                html.Button("Reset to SAP", id="edit-reset-btn", className="btn btn-outline",
                            style={"marginLeft": "8px"}, **{"data-aufnr": aufnr}),
            ]),
            html.Div(id="edit-save-msg", style={"marginTop": "8px", "fontSize": "12px", "color": "#22c55e"}),
        ])

        return {"display": "block"}, form

    @app.callback(
        Output("schedule-overrides", "data"),
        Output("edit-save-msg", "children"),
        Input("edit-save-btn", "n_clicks"),
        Input("edit-reset-btn", "n_clicks"),
        State("edit-pre-start", "value"),
        State("edit-post-end", "value"),
        State("edit-save-btn", "data-aufnr"),
        State("edit-reset-btn", "data-aufnr"),
        State("schedule-overrides", "data"),
        prevent_initial_call=True,
    )
    def save_override(save_clicks, reset_clicks, pre_start, post_end,
                      save_aufnr, reset_aufnr, overrides):
        triggered = ctx.triggered_id
        overrides = overrides or {}

        if triggered == "edit-save-btn" and save_aufnr:
            overrides[save_aufnr] = {"pre_start": pre_start, "post_end": post_end}
            return overrides, "✓ Saved to session"

        if triggered == "edit-reset-btn" and reset_aufnr:
            overrides.pop(reset_aufnr, None)
            return overrides, "Reset to SAP dates"

        return no_update, no_update
