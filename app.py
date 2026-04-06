"""
app.py - JIT Production Scheduler Dashboard
Entry point — run with:
    python app.py                        # dev
    gunicorn -w 4 app:server             # production
"""

import logging
import os

import dash
from dash import Dash, dcc, html, Input, Output

# ── Page modules ──────────────────────────────────────────────────────────────
from pages import dashboard, gantt, materials, ops_floor, purchasing

# ─────────────────────────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# App initialisation
# ─────────────────────────────────────────────────────────────────────────────
app = Dash(
    __name__,
    title="JIT Scheduler",
    update_title=None,
    suppress_callback_exceptions=True,
    meta_tags=[
        {"name": "viewport", "content": "width=device-width, initial-scale=1"},
    ],
)
server = app.server  # for gunicorn

# ─────────────────────────────────────────────────────────────────────────────
# Shell layout (sidebar + page outlet)
# ─────────────────────────────────────────────────────────────────────────────
NAV_ITEMS = [
    ("/",           "📊", "Dashboard"),
    ("/gantt",      "📅", "Gantt Chart"),
    ("/ops-floor",  "🏭", "Ops Floor"),
    ("/materials",  "📦", "Materials & Pick"),
    ("/purchasing", "🛒", "Purchasing"),
]

app.layout = html.Div([
    dcc.Location(id="url", refresh=False),

    # ── Sidebar ───────────────────────────────────────────────────────────────
    html.Nav(id="sidebar", children=[
        html.Div([
            html.H2("JIT Scheduler"),
            html.P("Production Planning"),
        ], id="sidebar-brand"),

        html.Div([
            html.A(
                [html.Span(icon, className="nav-icon"), html.Span(label)],
                href=href,
                className="nav-link",
                id=f"nav-{label.lower().replace(' ', '-').replace('&', 'and')}",
            )
            for href, icon, label in NAV_ITEMS
        ], id="sidebar-nav"),

        html.Div([
            html.Div("CSV reload: manual / auto", style={"marginBottom": "4px"}),
            html.Div("Internal network only", style={"color": "#334155"}),
        ], id="sidebar-footer"),
    ]),

    # ── Page content ──────────────────────────────────────────────────────────
    html.Main(id="page-content"),
])

# ─────────────────────────────────────────────────────────────────────────────
# Router
# ─────────────────────────────────────────────────────────────────────────────
@app.callback(
    Output("page-content", "children"),
    Input("url", "pathname"),
)
def render_page(pathname: str):
    if pathname in ("/", "/dashboard"):
        return dashboard.layout()
    if pathname == "/gantt":
        return gantt.layout()
    if pathname == "/ops-floor":
        return ops_floor.layout()
    if pathname == "/materials":
        return materials.layout()
    if pathname == "/purchasing":
        return purchasing.layout()
    # 404
    return html.Div([
        html.H1("404 – Page not found", style={"color": "#ef4444", "marginBottom": "8px"}),
        html.P(f"No page at '{pathname}'.", style={"color": "#64748b"}),
        html.A("← Back to Dashboard", href="/", style={"color": "#818cf8"}),
    ], style={"padding": "40px"})


# ── Active nav-link highlight ─────────────────────────────────────────────────
@app.callback(
    [Output(f"nav-{label.lower().replace(' ', '-').replace('&', 'and')}", "className")
     for _, _, label in NAV_ITEMS],
    Input("url", "pathname"),
)
def set_active_nav(pathname):
    results = []
    for href, _, _ in NAV_ITEMS:
        active = pathname == href or (href != "/" and (pathname or "").startswith(href))
        results.append("nav-link active" if active else "nav-link")
    return results


# ─────────────────────────────────────────────────────────────────────────────
# Register page-level callbacks
# ─────────────────────────────────────────────────────────────────────────────
dashboard.register_callbacks(app)
gantt.register_callbacks(app)
ops_floor.register_callbacks(app)
materials.register_callbacks(app)
purchasing.register_callbacks(app)

# ─────────────────────────────────────────────────────────────────────────────
# Dev server
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    host = os.environ.get("SCHEDULER_HOST", "0.0.0.0")
    port = int(os.environ.get("SCHEDULER_PORT", 8050))
    debug = os.environ.get("SCHEDULER_DEBUG", "false").lower() == "true"

    logger.info("Starting JIT Scheduler on %s:%s  debug=%s", host, port, debug)
    app.run(host=host, port=port, debug=debug)
