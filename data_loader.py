"""
data_loader.py - CSV ingestion, merging, and business logic
for the JIT Production Scheduler Dashboard.
"""

import os
import logging
from datetime import datetime, timedelta
import pandas as pd

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

# ── Internal semi lead time (business days) ──────────────────────────────────
DEFAULT_SEMI_LEAD_DAYS = 5


# ─────────────────────────────────────────────────────────────────────────────
# Raw loaders
# ─────────────────────────────────────────────────────────────────────────────

def _read_csv(filename: str, parse_dates: list[str] | None = None) -> pd.DataFrame:
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        logger.warning("CSV not found: %s", path)
        return pd.DataFrame()
    try:
        return pd.read_csv(path, parse_dates=parse_dates or [], dtype=str)
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to read %s: %s", filename, exc)
        return pd.DataFrame()


def load_orders() -> pd.DataFrame:
    df = _read_csv("orders.csv")
    if df.empty:
        return df
    for col in ("GSTRS", "GLTRP"):
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce")
    for col in ("GAMNG",):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    return df


def load_resb() -> pd.DataFrame:
    df = _read_csv("resb.csv")
    if df.empty:
        return df
    if "BDTER" in df.columns:
        df["BDTER"] = pd.to_datetime(df["BDTER"], errors="coerce")
    if "BDMNG" in df.columns:
        df["BDMNG"] = pd.to_numeric(df["BDMNG"], errors="coerce")
    return df


def load_mard() -> pd.DataFrame:
    df = _read_csv("mard.csv")
    if df.empty:
        return df
    for col in ("LABST", "EINME", "UMLME", "INSME"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    return df


def load_eop() -> pd.DataFrame:
    df = _read_csv("eop_milestones.csv")
    if df.empty:
        return df
    for col in ("MOUNT_TS", "TEST_TS", "FINAL_TS"):
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce")
    if "PCT_COMPLETE" in df.columns:
        df["PCT_COMPLETE"] = pd.to_numeric(df["PCT_COMPLETE"], errors="coerce").fillna(0)
    return df


def load_marc() -> pd.DataFrame:
    df = _read_csv("marc.csv")
    if df.empty:
        return df
    if "DZEIT" in df.columns:
        df["DZEIT"] = pd.to_numeric(df["DZEIT"], errors="coerce").fillna(DEFAULT_SEMI_LEAD_DAYS)
    return df


def load_open_po() -> pd.DataFrame:
    df = _read_csv("ekpo_open_po.csv")
    if df.empty:
        return df
    if "EINDT" in df.columns:
        df["EINDT"] = pd.to_datetime(df["EINDT"], errors="coerce")
    for col in ("MENGE", "NETPR"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    return df


# ─────────────────────────────────────────────────────────────────────────────
# Merged / enriched datasets
# ─────────────────────────────────────────────────────────────────────────────

def build_schedule() -> pd.DataFrame:
    """
    Main schedule DataFrame merging orders + EOP milestones.
    Adds Gantt bar columns and status colour.
    """
    orders = load_orders()
    eop = load_eop()

    if orders.empty:
        return pd.DataFrame()

    df = orders.copy()

    if not eop.empty:
        df = df.merge(eop[["AUFNR", "EOP_ID", "MOUNT_TS", "TEST_TS", "FINAL_TS",
                             "CURRENT_PHASE", "PCT_COMPLETE"]],
                      on="AUFNR", how="left")
    else:
        df[["EOP_ID", "MOUNT_TS", "TEST_TS", "FINAL_TS", "CURRENT_PHASE"]] = None
        df["PCT_COMPLETE"] = 0

    today = pd.Timestamp.now().normalize()

    # ── Derive Gantt start/end for pre-test and post-test bars ────────────────
    df["pre_start"] = df["MOUNT_TS"].fillna(df["GSTRS"])
    df["pre_end"] = df["TEST_TS"].fillna(
        df["pre_start"] + pd.Timedelta(days=3)
    )
    df["post_start"] = df["pre_end"]
    df["post_end"] = df["FINAL_TS"].fillna(df["GLTRP"])

    # ── Semi back-calculation: slot semis 5 days before mount ────────────────
    df["semi_latest_start"] = df["pre_start"] - pd.Timedelta(days=DEFAULT_SEMI_LEAD_DAYS)

    # ── Status colour logic ───────────────────────────────────────────────────
    def _status_color(row):
        phase = str(row.get("CURRENT_PHASE", "")).upper()
        pct = row.get("PCT_COMPLETE", 0) or 0
        end = row.get("post_end") or row.get("GLTRP")
        shortage = row.get("has_shortage", False)

        if shortage:
            return "red"
        if pd.isna(end):
            return "grey"
        if end < today:
            return "orange" if pct < 100 else "green"
        if phase in ("TEST", "FINAL") and pct >= 50:
            return "green"
        if phase == "MOUNT":
            return "green"
        return "orange"

    # Placeholder – shortage flag added later by merge_materials()
    df["has_shortage"] = False
    df["STATUS_COLOR"] = df.apply(_status_color, axis=1)

    return df


def merge_materials() -> pd.DataFrame:
    """
    Join RESB requirements with MARD stock.
    Returns per-component shortage analysis.
    """
    resb = load_resb()
    mard = load_mard()
    marc = load_marc()
    open_po = load_open_po()
    orders = load_orders()

    if resb.empty:
        return pd.DataFrame()

    df = resb.copy()

    # Attach order info (line, dates)
    if not orders.empty:
        df = df.merge(
            orders[["AUFNR", "LINE", "GSTRS", "MAKTX"]].rename(
                columns={"MAKTX": "ORDER_DESC"}
            ),
            on="AUFNR", how="left"
        )

    # Attach unrestricted stock
    if not mard.empty:
        stock = mard[["MATNR", "LABST", "EINME"]].copy()
        stock["available"] = stock["LABST"] + stock["EINME"]
        df = df.merge(stock[["MATNR", "LABST", "available"]], on="MATNR", how="left")
    else:
        df["LABST"] = 0
        df["available"] = 0

    df["LABST"] = df["LABST"].fillna(0)
    df["available"] = df["available"].fillna(0)

    # Attach open PO qty (incoming)
    if not open_po.empty:
        incoming = (
            open_po.groupby("MATNR")["MENGE"].sum().reset_index()
            .rename(columns={"MENGE": "po_qty"})
        )
        df = df.merge(incoming, on="MATNR", how="left")
    else:
        df["po_qty"] = 0

    df["po_qty"] = df["po_qty"].fillna(0)

    # Attach lead time from MARC
    if not marc.empty:
        df = df.merge(marc[["MATNR", "DZEIT", "BESKZ"]], on="MATNR", how="left")
    df["DZEIT"] = pd.to_numeric(df.get("DZEIT", DEFAULT_SEMI_LEAD_DAYS), errors="coerce").fillna(
        DEFAULT_SEMI_LEAD_DAYS
    )

    # ── Shortage calculation ──────────────────────────────────────────────────
    df["net_available"] = df["available"] + df["po_qty"]
    df["shortage_qty"] = (df["BDMNG"] - df["net_available"]).clip(lower=0)
    df["is_short"] = df["shortage_qty"] > 0

    # Recovery days estimate: shortage_qty / typical daily receipt (rough heuristic)
    df["recovery_days"] = (df["shortage_qty"] / df["BDMNG"] * df["DZEIT"]).round(0).astype(int)
    df.loc[~df["is_short"], "recovery_days"] = 0

    # Classify movement type for pick list
    df["PICK_TYPE"] = df["MATNR"].apply(
        lambda m: "FORKLIFT" if m.startswith("RM-HOUSING") or m.startswith("RM-BODY") else "CART"
    )

    return df


def get_shortage_summary() -> pd.DataFrame:
    """Orders with at least one short component."""
    mat = merge_materials()
    if mat.empty:
        return pd.DataFrame()
    short = mat[mat["is_short"]].groupby("AUFNR").agg(
        short_components=("MATNR", "count"),
        max_recovery_days=("recovery_days", "max"),
    ).reset_index()
    return short


def build_purchasing_escalation() -> pd.DataFrame:
    """
    Open PO lines that are late or risk blocking an order.
    Sorted by delay impact (days late * order qty).
    """
    open_po = load_open_po()
    orders = load_orders()
    mat = merge_materials()

    if open_po.empty:
        return pd.DataFrame()

    today = pd.Timestamp.now().normalize()
    df = open_po.copy()

    df["days_late"] = (today - df["EINDT"]).dt.days.clip(lower=0)

    # Identify if PO material is on a short component
    if not mat.empty:
        short_matnr = set(mat.loc[mat["is_short"], "MATNR"].tolist())
        df["blocks_order"] = df["MATNR"].isin(short_matnr)
    else:
        df["blocks_order"] = False

    # Attach earliest order start that needs this component
    if not mat.empty and not orders.empty:
        earliest = (
            mat.merge(orders[["AUFNR", "GSTRS"]], on="AUFNR", how="left")
            .groupby("MATNR")["GSTRS"].min().reset_index()
            .rename(columns={"GSTRS": "earliest_order_start"})
        )
        df = df.merge(earliest, on="MATNR", how="left")

    df["impact_score"] = df["days_late"] * df["MENGE"]
    df = df.sort_values(["blocks_order", "impact_score"], ascending=[False, False])

    return df


def reload_all() -> dict:
    """Reload and return all data as a dict of DataFrames."""
    return {
        "schedule": build_schedule(),
        "materials": merge_materials(),
        "purchasing": build_purchasing_escalation(),
        "shortage_summary": get_shortage_summary(),
    }
