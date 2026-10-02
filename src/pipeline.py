"""
Data Pipeline - Orchestrates data collection and metric computation.
"""
import logging
import sys
from pathlib import Path
from typing import Dict, Tuple
import pandas as pd
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))

from collectors.google_trends import GoogleTrendsCollector
from collectors.wikipedia import WikipediaCollector
from metrics.attention_score import compute_attention_score
from metrics.velocity import compute_velocity, compute_growth_rate
from metrics.half_life import compute_topic_summary

logger = logging.getLogger(__name__)
CONFIG_PATH = Path(__file__).resolve().parents[1] / "config" / "topics.yaml"
PROCESSED_DIR = Path(__file__).resolve().parents[1] / "data" / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


def load_config() -> dict:
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_topic_lists(config: dict) -> Tuple[list, Dict[str, str], Dict[str, str]]:
    topic_names = []
    wiki_map = {}
    topic_to_category = {}
    for category, meta in config["topics"].items():
        for item in meta["items"]:
            name = item["name"]
            topic_names.append(name)
            wiki_map[name] = item["wikipedia"]
            topic_to_category[name] = category
    return topic_names, wiki_map, topic_to_category


def run_pipeline(force_refresh: bool = False) -> Tuple[pd.DataFrame, pd.DataFrame]:
    config = load_config()
    settings = config.get("settings", {})
    topic_names, wiki_map, _ = get_topic_lists(config)
    gt_weight = settings.get("google_trends_weight", 0.7)
    wiki_weight = settings.get("wikipedia_weight", 0.3)
    timeframe = settings.get("timeframe", "today 3-m")
    days = 90 if "3-m" in timeframe else 365

    trends_collector = GoogleTrendsCollector(timeframe=timeframe)
    wiki_collector = WikipediaCollector(days=days)
    trends_df = trends_collector.fetch(topic_names, force_refresh=force_refresh)
    wiki_df = wiki_collector.fetch(wiki_map, force_refresh=force_refresh)

    attention_df = compute_attention_score(trends_df, wiki_df, gt_weight=gt_weight, wiki_weight=wiki_weight)
    attention_df = compute_velocity(attention_df)
    attention_df = compute_growth_rate(attention_df, window_days=settings.get("rising_window_days", 7))
    summary_df = compute_topic_summary(attention_df)
    return attention_df, summary_df