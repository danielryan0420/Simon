"""
gunicorn.conf.py - Production server configuration.

Usage:
    gunicorn -c gunicorn.conf.py app:server

Or with explicit flags:
    gunicorn -w 4 --timeout 120 -b 0.0.0.0:8050 app:server
"""

import multiprocessing

# ── Binding ───────────────────────────────────────────────────────────────────
# Change to your internal IP, e.g. "192.168.1.50:8050"
bind = "0.0.0.0:8050"

# ── Workers ───────────────────────────────────────────────────────────────────
# Rule of thumb: (2 × CPU cores) + 1
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"   # use "uvicorn.workers.UvicornWorker" for async
threads = 2
timeout = 120
keepalive = 5

# ── Logging ───────────────────────────────────────────────────────────────────
accesslog = "-"        # stdout
errorlog = "-"         # stderr
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s %(D)sµs'

# ── Process name ──────────────────────────────────────────────────────────────
proc_name = "jit-scheduler"
