import logging
from pathlib import Path
import pandas as pd

logger = logging.getLogger(__name__)
PROCESSED_DIR = Path(__file__).resolve().parents[2] / "data" / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

def _minmax_normalize(series: pd.Series) -> pd.Series:
    if series.empty or series.max() == series.min():
        return pd.Series([0.0] * len(series), index=series.index)
    return (series - series.min()) / (series.max() - series.min()) * 100

def compute_attention_score(trends_df, wiki_df, gt_weight=0.7, wiki_weight=0.3):
    trends_df = trends_df.copy()
    wiki_df = wiki_df.copy()
    trends_df["date"] = pd.to_datetime(trends_df["date"])
    wiki_df["date"] = pd.to_datetime(wiki_df["date"])
    merged = pd.merge(trends_df, wiki_df, on=["date", "topic"], how="outer").fillna(0)
    merged["gt_norm"] = _minmax_normalize(merged["search_interest"])
    merged["wiki_norm"] = _minmax_normalize(merged["wikipedia_views"])
    merged["attention_score"] = (gt_weight * merged["gt_norm"] + wiki_weight * merged["wiki_norm"]).clip(0, 100)
    merged = merged.sort_values(["topic", "date"]).reset_index(drop=True)
    merged.to_csv(PROCESSED_DIR / "attention_scores.csv", index=False)
    return merged