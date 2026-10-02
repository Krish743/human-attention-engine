import logging, time, requests
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict
import pandas as pd

logger = logging.getLogger(__name__)
RAW_DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "raw"
RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
WIKI_API = "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article"
HEADERS = {"User-Agent": "GHAE-Project/1.0"}

class WikipediaCollector:
    def __init__(self, days=90, sleep=0.3):
        self.days = days
        self.sleep = sleep
        self._end = datetime.utcnow() - timedelta(days=1)
        self._start = self._end - timedelta(days=days)

    def _fetch_article(self, article: str) -> pd.DataFrame:
        start_str = self._start.strftime("%Y%m%d")
        end_str = self._end.strftime("%Y%m%d")
        url = f"{WIKI_API}/en.wikipedia/all-access/all-agents/{article}/daily/{start_str}/{end_str}"
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            resp.raise_for_status()
            items = resp.json().get("items", [])
            records = [{"date": datetime.strptime(item["timestamp"], "%Y%m%d00"), "views": item["views"]} for item in items]
            return pd.DataFrame(records)
        except Exception as exc:
            logger.warning("Wikipedia fetch failed for %s: %s", article, exc)
            return pd.DataFrame(columns=["date", "views"])

    def fetch(self, topic_map: Dict[str, str], force_refresh: bool = False) -> pd.DataFrame:
        cache_path = RAW_DATA_DIR / "wikipedia_views.csv"
        if not force_refresh and cache_path.exists():
            logger.info("Loading Wikipedia from cache")
            return pd.read_csv(cache_path, parse_dates=["date"])
        all_frames = []
        for display_name, article in topic_map.items():
            df = self._fetch_article(article)
            if df.empty:
                continue
            df["topic"] = display_name
            df = df.rename(columns={"views": "wikipedia_views"})
            all_frames.append(df[["date", "topic", "wikipedia_views"]])
            time.sleep(self.sleep)
        if not all_frames:
            return pd.DataFrame(columns=["date", "topic", "wikipedia_views"])
        result = pd.concat(all_frames, ignore_index=True)
        result.to_csv(cache_path, index=False)
        return result