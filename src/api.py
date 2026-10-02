"""
GHAE FastAPI Backend
====================
Serves attention data, metrics, and network graph to the React frontend.

Run with:
    uvicorn src.api:app --reload --port 8000
"""

import sys
import math
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from pipeline import run_pipeline, load_config, get_topic_lists
from metrics.attention_score import compute_attention_score
from metrics.velocity import compute_velocity, compute_growth_rate
from metrics.half_life import compute_topic_summary
from network.topic_graph import build_attention_graph, build_correlation_matrix

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="GHAE API",
    description="Global Human Attention Engine — REST API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_cache: Dict[str, Any] = {}


def sanitize_val(val: Any) -> Any:
    """Recursively clean NaNs and Infs for JSON compliance."""
    if val is None:
        return None
    if isinstance(val, (float, np.floating)):
        if math.isnan(val) or math.isinf(val):
            return None
        return float(val)
    if isinstance(val, (int, np.integer)):
        return int(val)
    if isinstance(val, dict):
        return {k: sanitize_val(v) for k, v in val.items()}
    if isinstance(val, list):
        return [sanitize_val(v) for v in val]
    if isinstance(val, pd.Timestamp):
        return val.strftime("%Y-%m-%d")
    return val


def get_data(gt_weight: float = 0.7, wiki_weight: float = 0.3, force: bool = False):
    cache_key = f"{gt_weight:.2f}_{wiki_weight:.2f}"

    if not force and cache_key in _cache:
        return _cache[cache_key]

    attention_df, summary_df = run_pipeline(force_refresh=force)

    if abs(gt_weight - 0.7) > 0.01:
        from collectors.google_trends import RAW_DATA_DIR
        t = RAW_DATA_DIR / "google_trends.csv"
        w = RAW_DATA_DIR / "wikipedia_views.csv"
        if t.exists() and w.exists():
            trends = pd.read_csv(t, parse_dates=["date"])
            wiki = pd.read_csv(w, parse_dates=["date"])
            attention_df = compute_attention_score(trends, wiki, gt_weight=gt_weight, wiki_weight=wiki_weight)
            attention_df = compute_velocity(attention_df)
            attention_df = compute_growth_rate(attention_df)
            summary_df = compute_topic_summary(attention_df)

    cfg = load_config()
    _, _, topic_to_category = get_topic_lists(cfg)
    cat_colors = {cat: meta["color"] for cat, meta in cfg["topics"].items()}
    cat_icons = {cat: meta.get("icon", "•") for cat, meta in cfg["topics"].items()}

    result = {
        "attention_df": attention_df,
        "summary_df": summary_df,
        "cfg": cfg,
        "topic_to_category": topic_to_category,
        "cat_colors": cat_colors,
        "cat_icons": cat_icons,
    }
    _cache[cache_key] = result
    return result


def df_to_records(df: pd.DataFrame) -> List[Dict]:
    records = df.to_dict(orient="records")
    return [sanitize_val(r) for r in records]


@app.get("/")
def root():
    return {"status": "ok", "service": "GHAE API v1.0"}


@app.get("/api/overview")
def overview(
    gt_weight: float = Query(0.7, ge=0, le=1),
):
    wiki_weight = round(1 - gt_weight, 2)
    data = get_data(gt_weight=gt_weight, wiki_weight=wiki_weight)
    summary_df = data["summary_df"]
    topic_to_category = data["topic_to_category"]
    cat_colors = data["cat_colors"]
    cat_icons = data["cat_icons"]

    scoreboard = []
    for _, row in summary_df.iterrows():
        cat = topic_to_category.get(row["topic"], "")
        scoreboard.append({
            "topic": row["topic"],
            "category": cat,
            "color": cat_colors.get(cat, "#6366f1"),
            "icon": cat_icons.get(cat, "•"),
            "current_score": row["current_score"],
            "peak_score": row["peak_score"],
            "avg_score": row["avg_score"],
            "growth_7d": row["growth_7d"],
            "volatility": row["volatility"],
            "half_life_days": row["half_life_days"],
        })

    top = summary_df.iloc[0] if not summary_df.empty else None
    rising = summary_df[summary_df["growth_7d"] > 2] if "growth_7d" in summary_df.columns else pd.DataFrame()
    declining = summary_df[summary_df["growth_7d"] < -2] if "growth_7d" in summary_df.columns else pd.DataFrame()

    response = {
        "kpis": {
            "total_topics": len(summary_df),
            "top_topic": top["topic"] if top is not None else "N/A",
            "top_score": top["current_score"] if top is not None else 0.0,
            "rising_count": len(rising),
            "declining_count": len(declining),
        },
        "scoreboard": scoreboard,
        "rising": df_to_records(rising.head(5)),
        "declining": df_to_records(declining.head(5)),
    }
    return sanitize_val(response)


@app.get("/api/timeseries")
def timeseries(
    topics: str = Query(..., description="Comma-separated topic names"),
    gt_weight: float = Query(0.7, ge=0, le=1),
):
    wiki_weight = round(1 - gt_weight, 2)
    data = get_data(gt_weight=gt_weight, wiki_weight=wiki_weight)
    attention_df = data["attention_df"]

    topic_list = [t.strip() for t in topics.split(",") if t.strip()]
    filtered = attention_df[attention_df["topic"].isin(topic_list)].sort_values("date").copy()
    if not filtered.empty and pd.api.types.is_datetime64_any_dtype(filtered["date"]):
        filtered["date"] = filtered["date"].dt.strftime("%Y-%m-%d")

    result = {}
    for topic in topic_list:
        t_data = filtered[filtered["topic"] == topic]
        cols = ["date", "attention_score", "gt_norm", "wiki_norm", "velocity", "growth_rate"]
        existing_cols = [c for c in cols if c in t_data.columns]
        result[topic] = df_to_records(t_data[existing_cols])

    return sanitize_val(result)


@app.get("/api/topic/{topic_name}")
def topic_detail(
    topic_name: str,
    gt_weight: float = Query(0.7, ge=0, le=1),
):
    wiki_weight = round(1 - gt_weight, 2)
    data = get_data(gt_weight=gt_weight, wiki_weight=wiki_weight)
    summary_df = data["summary_df"]
    attention_df = data["attention_df"]
    topic_to_category = data["topic_to_category"]
    cat_colors = data["cat_colors"]
    cat_icons = data["cat_icons"]

    row = summary_df[summary_df["topic"] == topic_name]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"Topic '{topic_name}' not found")

    row = row.iloc[0]
    cat = topic_to_category.get(topic_name, "")

    topic_ts = attention_df[attention_df["topic"] == topic_name].sort_values("date").copy()
    if not topic_ts.empty and pd.api.types.is_datetime64_any_dtype(topic_ts["date"]):
        topic_ts["date"] = topic_ts["date"].dt.strftime("%Y-%m-%d")

    cols = ["date", "attention_score", "gt_norm", "wiki_norm", "velocity", "growth_rate"]
    existing_cols = [c for c in cols if c in topic_ts.columns]

    response = {
        "topic": topic_name,
        "category": cat,
        "color": cat_colors.get(cat, "#6366f1"),
        "icon": cat_icons.get(cat, "•"),
        "metrics": {
            "current_score": row["current_score"],
            "peak_score": row["peak_score"],
            "avg_score": row["avg_score"],
            "volatility": row["volatility"],
            "latest_velocity": row.get("latest_velocity", 0.0),
            "growth_7d": row.get("growth_7d", 0.0),
            "half_life_days": row.get("half_life_days", None),
        },
        "timeseries": df_to_records(topic_ts[existing_cols]),
    }
    return sanitize_val(response)


@app.get("/api/network")
def network(
    threshold: float = Query(0.7, ge=0, le=1),
    gt_weight: float = Query(0.7, ge=0, le=1),
):
    wiki_weight = round(1 - gt_weight, 2)
    data = get_data(gt_weight=gt_weight, wiki_weight=wiki_weight)
    attention_df = data["attention_df"]
    topic_to_category = data["topic_to_category"]
    cat_colors = data["cat_colors"]

    G = build_attention_graph(attention_df, threshold=threshold)

    nodes = []
    for node, attrs in G.nodes(data=True):
        cat = topic_to_category.get(node, "")
        nodes.append({
            "id": node,
            "category": cat,
            "color": cat_colors.get(cat, "#6366f1"),
            "current_score": attrs.get("current_score", 0),
            "avg_score": attrs.get("avg_score", 0),
        })

    edges = [
        {"source": u, "target": v, "weight": round(d.get("weight", 0), 3)}
        for u, v, d in G.edges(data=True)
    ]

    corr_matrix = build_correlation_matrix(attention_df)
    topics_list = corr_matrix.columns.tolist()
    corr_values = corr_matrix.fillna(0.0).values.tolist()

    response = {
        "nodes": nodes,
        "edges": edges,
        "stats": {
            "node_count": G.number_of_nodes(),
            "edge_count": G.number_of_edges(),
            "threshold": threshold,
        },
        "correlation_matrix": {
            "topics": topics_list,
            "values": corr_values,
        },
    }
    return sanitize_val(response)


@app.get("/api/categories")
def categories():
    data = get_data()
    cfg = data["cfg"]
    result = {}
    for cat, meta in cfg["topics"].items():
        result[cat] = {
            "color": meta["color"],
            "icon": meta.get("icon", "•"),
            "topics": [item["name"] for item in meta["items"]],
        }
    return sanitize_val(result)


@app.post("/api/refresh")
def refresh_data():
    global _cache
    _cache.clear()
    try:
        get_data(force=True)
        return {"status": "ok", "message": "Data refreshed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))