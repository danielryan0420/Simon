"""
pages/dashboard.py - Overview dashboard: KPI tiles, alerts,
bottleneck analysis, and CSV refresh control.
"""

import pandas as pd
import plotly.graph_objects as go
from dash import dcc, html, Input, Output, callback

import data_loader as dl

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _mini_bar_chart(values: dict[str, int], colors: dict[str, str]) -> go.Figure:
    fig = go.Figure(go.Bar(
        x=list(values.keys()),
        y=list(values.values()),
        marker_color=[colors.get(k, "#60a5fa") for k in values],
        text=list(values.values()),
        textposition="outside",
        textfont=dict(color="#e2e8f0", size=12),
    ))
    fig.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#94a3b8", size=11),
        xaxis=dict(showgrid=False, tickfont=dict(color="#94a3b8", size=11)),
        yaxis=dict(showgrid=True, gridcolor="#2d3148", tickfont=dict(color="#94a3b8")),
        margin=dict(l=0, r=0, t=10, b=0),
        height=200,
        showlegend=False,
    )
    return fig


def _donut(on_track: int, warning: int, critical: int) -> go.Figure:
    fig = go.Figure(go.Pie(
        labels=["On-Track", "Waiting", "Critical"],
        values=[max(on_track, 0), max(warning, 0), max(critical, 0)],
        hole=0.6,
        marker_colors=["#22c55e", "#f97316", "#ef4444"],
        textinfo="none",
    ))
    fig.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#94a3b8", size=11),
        legend=dict(font=dict(color="#94a3b8", size=11), bgcolor="rgba(0,0,0,0)"),
        margin=dict(l=0, r=0, t=10, b=0),
        height=220,
    )
    return fig


# ─────────────────────────────────────────────────────────────────────────────
# Layout
# ─────────────────────────────────────────────────────────────────────────────

def layout():
    return html.Div([
        html.Div([
            html.Div([
                html.H1("Dashboard"),
                html.P("Production overview — alerts, KPIs, bottlenecks"),
            ]),
            html.Div([
                html.Span(id="dash-last-refresh", style={"fontSize": "12px", "color": "#64748b"}),
                html.Button("⟳ Refresh All CSVs", id="dash-refresh-btn", className="btn btn-primary",
                            style={"marginLeft": "12px"}),
            ], style={"display": "flex", "alignItems": "center"}),
        ], className="page-header"),

        # KPI tiles
        html.Div(id="dash-kpi-tiles", className="stat-grid"),

        # Alerts
        html.Div([
            html.Div("Active Alerts", className="card-title"),
            html.Div(id="dash-alerts"),
        ], className="card"),

        # Charts row
        html.Div([
            # Order status donut
            html.Div([
                html.Div("Order Status Mix", className="card-title"),
                dcc.Graph(id="dash-donut", config={"displayModeBar": False}),
            ], className="card", style={"flex": "1", "minWidth": "260px"}),

            # Orders per line bar
            html.Div([
                html.Div("Orders by Line", className="card-title"),
                dcc.Graph(id="dash-line-bar", config={"displayModeBar": False}),
            ], className="card", style={"flex": "2", "minWidth": "340px"}),
        ], style={"display": "flex", "gap": "16px", "flexWrap": "wrap"}),

        # Bottlenecks
        html.Div([
            html.Div("Bottleneck Analysis", className="card-title"),
            html.Div(id="dash-bottlenecks"),
        ], className="card"),

        # Semi back-calc reminders
        html.Div([
            html.Div("Internal Semi Scheduling (5-day lead)", className="card-title"),
            html.Div(id="dash-semi-reminders"),
        ], className="card"),

        # Auto-refresh interval
        dcc.Interval(id="dash-interval", interval=300_000, n_intervals=0),  # 5 min
    ])


# ─────────────────────────────────────────────────────────────────────────────
# Callbacks
# ─────────────────────────────────────────────────────────────────────────────

def register_callbacks(app):

    @app.callback(
        Output("dash-kpi-tiles", "children"),
        Output("dash-alerts", "children"),
        Output("dash-donut", "figure"),
        Output("dash-line-bar", "figure"),
        Output("dash-bottlenecks", "children"),
        Output("dash-semi-reminders", "children"),
        Output("dash-last-refresh", "children"),
        Input("dash-refresh-btn", "n_clicks"),
        Input("dash-interval", "n_intervals"),
    )
    def refresh_dashboard(n_clicks, n_intervals):
        data = dl.reload_all()
        schedule = data["schedule"]
        materials = data["materials"]
        purchasing = data["purchasing"]
        shortage_summary = data["shortage_summary"]

        ts = pd.Timestamp.now().strftime("%d %b %Y %H:%M:%S")
        today = pd.Timestamp.now().normalize()

        # ── KPI tiles ─────────────────────────────────────────────────────────
        if not schedule.empty:
            total_orders = len(schedule)
            on_track = (schedule["STATUS_COLOR"] == "green").sum()
            warning = (schedule["STATUS_COLOR"] == "orange").sum()
            critical = (schedule["STATUS_COLOR"] == "red").sum()
            avg_pct = int(schedule["PCT_COMPLETE"].fillna(0).mean()) if "PCT_COMPLETE" in schedule else 0
        else:
            total_orders = on_track = warning = critical = avg_pct = 0

        short_orders = len(shortage_summary) if not shortage_summary.empty else 0

        if not purchasing.empty and "days_late" in purchasing.columns:
            late_pos = (purchasing["days_late"] > 0).sum()
        else:
            late_pos = 0

        tiles = [
            html.Div([html.Div(str(total_orders), className="stat-value"), html.Div("Active Orders", className="stat-label")],
                     className="stat-tile stat-blue"),
            html.Div([html.Div(str(on_track), className="stat-value"), html.Div("On-Track", className="stat-label")],
                     className="stat-tile stat-green"),
            html.Div([html.Div(str(warning), className="stat-value"), html.Div("Waiting", className="stat-label")],
                     className="stat-tile stat-orange"),
            html.Div([html.Div(str(critical), className="stat-value"), html.Div("Critical", className="stat-label")],
                     className="stat-tile stat-red"),
            html.Div([html.Div(f"{avg_pct}%", className="stat-value"), html.Div("Avg Complete", className="stat-label")],
                     className="stat-tile"),
            html.Div([html.Div(str(short_orders), className="stat-value"), html.Div("Orders Short", className="stat-label")],
                     className="stat-tile stat-red"),
            html.Div([html.Div(str(late_pos), className="stat-value"), html.Div("Late POs", className="stat-label")],
                     className="stat-tile stat-orange"),
        ]

        # ── Alerts ────────────────────────────────────────────────────────────
        alerts = []

        # Critical orders
        if not schedule.empty:
            crit_orders = schedule[schedule["STATUS_COLOR"] == "red"]
            for _, r in crit_orders.head(3).iterrows():
                alerts.append(html.Div([
                    html.Span("🔴 "),
                    html.Strong(f"Order {r['AUFNR']} – {r.get('MAKTX', '')}"),
                    html.Span(f"  on {r.get('LINE', '-')} | Critical — material shortage or delay",
                              style={"fontSize": "12px"}),
                ], className="alert alert-red", style={"marginBottom": "6px"}))

        # Overdue / near-due
        if not schedule.empty and "post_end" in schedule.columns:
            near_due = schedule[
                pd.to_datetime(schedule["post_end"], errors="coerce").between(today, today + pd.Timedelta(days=3))
            ]
            for _, r in near_due.head(3).iterrows():
                due = pd.to_datetime(r["post_end"])
                diff = (due - today).days
                alerts.append(html.Div([
                    html.Span("⚡ "),
                    html.Strong(f"Order {r['AUFNR']} – {r.get('MAKTX', '')}"),
                    html.Span(f"  due in {diff} day(s) — {int(r.get('PCT_COMPLETE', 0))}% complete",
                              style={"fontSize": "12px"}),
                ], className="alert alert-orange", style={"marginBottom": "6px"}))

        # Late PO blocking
        if not purchasing.empty and "blocks_order" in purchasing.columns:
            blocking = purchasing[purchasing["blocks_order"] == True].head(2)
            for _, r in blocking.iterrows():
                alerts.append(html.Div([
                    html.Span("⚠ "),
                    html.Strong(f"PO {r.get('EBELN', '?')} – {r.get('MAKTX', '')}"),
                    html.Span(f"  {int(r.get('days_late', 0))}d late | Vendor: {r.get('NAME1', '-')} | Blocking production",
                              style={"fontSize": "12px"}),
                ], className="alert alert-orange", style={"marginBottom": "6px"}))

        if not alerts:
            alerts = [html.Div("✓ No critical alerts. All systems nominal.", className="alert alert-green")]

        # ── Donut ─────────────────────────────────────────────────────────────
        donut_fig = _donut(int(on_track), int(warning), int(critical))

        # ── Bar by line ───────────────────────────────────────────────────────
        if not schedule.empty and "LINE" in schedule.columns:
            line_counts = schedule.groupby("LINE")["STATUS_COLOR"].value_counts().unstack(fill_value=0)
            colors_map = {"green": "#22c55e", "orange": "#f97316", "red": "#ef4444", "grey": "#475569"}

            bar_fig = go.Figure()
            for status in ["green", "orange", "red", "grey"]:
                if status in line_counts.columns:
                    bar_fig.add_trace(go.Bar(
                        name=status.capitalize(),
                        x=line_counts.index.tolist(),
                        y=line_counts[status].tolist(),
                        marker_color=colors_map[status],
                    ))

            bar_fig.update_layout(
                barmode="stack",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font=dict(color="#94a3b8", size=11),
                xaxis=dict(showgrid=False, tickfont=dict(color="#94a3b8")),
                yaxis=dict(showgrid=True, gridcolor="#2d3148", tickfont=dict(color="#94a3b8")),
                legend=dict(font=dict(color="#94a3b8", size=11), bgcolor="rgba(0,0,0,0)",
                            orientation="h", yanchor="bottom", y=1.02),
                margin=dict(l=0, r=0, t=30, b=0),
                height=200,
            )
        else:
            bar_fig = go.Figure()

        # ── Bottlenecks ───────────────────────────────────────────────────────
        bottleneck_items = []
        if not materials.empty:
            worst = materials[materials["is_short"]].sort_values("recovery_days", ascending=False).head(5)
            if not worst.empty:
                for _, r in worst.iterrows():
                    bottleneck_items.append(html.Div([
                        html.Div([
                            html.Span(r.get("MATNR", ""), style={"fontWeight": "600", "color": "#818cf8"}),
                            html.Span(f" — {r.get('MAKTX', '')}", style={"color": "#94a3b8", "fontSize": "12px"}),
                        ]),
                        html.Div([
                            html.Span(f"Short: {int(r['shortage_qty'])} {r.get('MEINS', 'EA')}  ",
                                      style={"color": "#ef4444", "fontSize": "12px"}),
                            html.Span(f"Recovery: ~{int(r['recovery_days'])} days  ",
                                      style={"color": "#f97316", "fontSize": "12px"}),
                            html.Span(f"Order: {r['AUFNR']}",
                                      style={"color": "#64748b", "fontSize": "12px"}),
                        ], style={"marginTop": "2px"}),
                    ], style={"padding": "10px 0", "borderBottom": "1px solid #2d3148"}))
            else:
                bottleneck_items = [html.P("No material bottlenecks.", style={"color": "#22c55e", "fontSize": "13px"})]
        else:
            bottleneck_items = [html.P("No materials data available.", style={"color": "#64748b", "fontSize": "13px"})]

        # ── Semi back-calc reminders ──────────────────────────────────────────
        semi_items = []
        if not schedule.empty and "semi_latest_start" in schedule.columns:
            upcoming = schedule[
                pd.to_datetime(schedule["semi_latest_start"], errors="coerce").between(
                    today, today + pd.Timedelta(days=7)
                )
            ].sort_values("semi_latest_start")

            for _, r in upcoming.head(6).iterrows():
                semi_date = pd.to_datetime(r["semi_latest_start"])
                days_until = (semi_date - today).days
                urgency_class = "alert-red" if days_until <= 1 else "alert-orange" if days_until <= 3 else "alert-green"
                semi_items.append(html.Div([
                    html.Span("📦 "),
                    html.Strong(f"Order {r['AUFNR']} – {r.get('MAKTX', '')}"),
                    html.Span(
                        f"  Start semis by {semi_date.strftime('%d %b')} "
                        f"(in {days_until} day(s)) for mount on {pd.to_datetime(r.get('pre_start')).strftime('%d %b') if pd.notna(r.get('pre_start')) else '?'}",
                        style={"fontSize": "12px"}
                    ),
                ], className=f"alert {urgency_class}", style={"marginBottom": "6px"}))

            if not semi_items:
                semi_items = [html.P("No semi releases due in next 7 days.", style={"color": "#22c55e", "fontSize": "13px"})]

        return tiles, alerts, donut_fig, bar_fig, bottleneck_items, semi_items, f"Last refreshed: {ts}"
